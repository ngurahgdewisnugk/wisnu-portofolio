#!/usr/bin/env bash
# Zero-touch deploy with automatic rollback. Runs on the EC2 host.
#
# Usage (from the CD pipeline, registry token on stdin):
#   echo "$GHCR_TOKEN" | bash scripts/deploy.sh <image@digest> <git-sha> <ghcr-user>
#
# 1. Log in to GHCR with a short-lived token (logged out again on exit).
# 2. Pull and start the new image; wait until every container is healthy.
# 3. Verify /version through Nginx reports the expected commit.
# 4. On any failure, start the previously deployed image again and exit 1.
# 5. Start/refresh the monitoring stack and check every Prometheus target is up.
#    A monitoring failure exits 2 WITHOUT rolling back: the app is healthy, but
#    the pipeline still goes red so the problem gets noticed.

set -Eeuo pipefail

readonly NEW_IMAGE="${1:?usage: deploy.sh <image> <git-sha> <ghcr-user>}"
readonly EXPECTED_SHA="${2:?missing git sha}"
readonly GHCR_USER="${3:?missing ghcr user}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly APP_DIR
readonly STATE_DIR="${APP_DIR}/.deploy"
readonly CURRENT_FILE="${STATE_DIR}/current_image"
readonly HISTORY_FILE="${STATE_DIR}/history.log"
readonly BASE_URL="${DEPLOY_CHECK_URL:-http://127.0.0.1}"
readonly WAIT_TIMEOUT="${DEPLOY_WAIT_TIMEOUT:-180}"
readonly PROMETHEUS_URL="http://127.0.0.1:9090"
readonly GRAFANA_URL="http://127.0.0.1:3001"

readonly APP_SERVICES=(web nginx)
readonly MONITORING_SERVICES=(prometheus grafana node-exporter blackbox-exporter nginx-exporter)

log() { printf '%s [deploy] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

compose() {
  local image="$1"
  shift
  APP_IMAGE="${image}" docker compose --project-directory "${APP_DIR}" "$@"
}

# Every check must see the new commit several times in a row, so that all
# replicas behind the round-robin load balancer are proven to be updated.
verify_release() {
  local ok=0 commit
  for _ in $(seq 1 30); do
    commit="$(curl -fsS --max-time 3 "${BASE_URL}/version" | jq -r '.commit' 2>/dev/null)" || commit=""
    if [[ "${commit}" == "${EXPECTED_SHA}" ]]; then
      ok=$((ok + 1))
      [[ ${ok} -ge 5 ]] && return 0
    else
      ok=0
    fi
    sleep 2
  done
  log "expected commit ${EXPECTED_SHA}, last seen '${commit}'"
  return 1
}

# NOTE: start/start_monitoring run inside `if`, where `set -e` is disabled,
# so every step returns explicitly on failure.
start() {
  compose "$1" pull --quiet web || return 1
  compose "$1" up -d --remove-orphans --wait --wait-timeout "${WAIT_TIMEOUT}" "${APP_SERVICES[@]}" || return 1
  # A changed nginx.conf does not recreate the container; validate, then reload.
  compose "$1" exec -T nginx nginx -t -q || return 1
  compose "$1" exec -T nginx nginx -s reload || return 1
}

# Poll a URL until it answers 2xx, up to $2 seconds.
wait_for() {
  local url="$1" timeout="$2" waited=0
  until curl -fsS --max-time 3 -o /dev/null "${url}"; do
    waited=$((waited + 3))
    if [[ ${waited} -ge ${timeout} ]]; then
      log "${url} not ready after ${timeout}s"
      return 1
    fi
    sleep 3
  done
}

# Every active Prometheus target must be up, and Prometheus must see one
# portfolio-web target per running web container (Docker DNS discovery).
verify_targets() {
  local want json='{"data":{"activeTargets":[]}}' total=0 down=0 web=0
  want="$(compose "${NEW_IMAGE}" ps -q web | wc -l)"
  for _ in $(seq 1 30); do
    json="$(curl -fsS --max-time 3 "${PROMETHEUS_URL}/api/v1/targets?state=active")" \
      || json='{"data":{"activeTargets":[]}}'
    total="$(jq '.data.activeTargets | length' <<<"${json}")"
    down="$(jq '[.data.activeTargets[] | select(.health != "up")] | length' <<<"${json}")"
    web="$(jq '[.data.activeTargets[] | select(.labels.job == "portfolio-web" and .health == "up")] | length' <<<"${json}")"
    if [[ ${total} -gt 0 && ${down} -eq 0 && ${web} -eq ${want} ]]; then
      log "monitoring: ${total} targets up, ${web}/${want} web replicas scraped"
      jq -r '.data.activeTargets[] | "  \(.labels.job)\t\(.labels.instance)\t\(.health)"' <<<"${json}"
      return 0
    fi
    sleep 3
  done
  log "monitoring: ${down} of ${total} targets not up, ${web}/${want} web replicas scraped"
  jq -r '.data.activeTargets[] | "  \(.labels.job)\t\(.labels.instance)\t\(.health)\t\(.lastError)"' <<<"${json}"
  return 1
}

start_monitoring() {
  compose "${NEW_IMAGE}" up -d --wait --wait-timeout "${WAIT_TIMEOUT}" "${MONITORING_SERVICES[@]}" || return 1
  # Bind-mounted config changes do not restart containers: validate, then reload.
  compose "${NEW_IMAGE}" exec -T prometheus promtool check config /etc/prometheus/prometheus.yml >/dev/null || return 1
  compose "${NEW_IMAGE}" kill -s SIGHUP prometheus blackbox-exporter >/dev/null || return 1
  wait_for "${PROMETHEUS_URL}/-/ready" 60 || return 1
  wait_for "${GRAFANA_URL}/api/health" 180 || return 1
  verify_targets
}

rollback() {
  if [[ -n "${PREVIOUS_IMAGE}" && "${PREVIOUS_IMAGE}" != "${NEW_IMAGE}" ]]; then
    log "ROLLBACK to ${PREVIOUS_IMAGE}"
    start "${PREVIOUS_IMAGE}"
    printf '%s rollback %s\n' "$(date -u +%FT%TZ)" "${PREVIOUS_IMAGE}" >> "${HISTORY_FILE}"
    log "rollback complete; previous release is serving traffic"
  else
    log "no previous release to roll back to"
  fi
}

mkdir -p "${STATE_DIR}"
PREVIOUS_IMAGE=""
if [[ -f "${CURRENT_FILE}" ]]; then
  PREVIOUS_IMAGE="$(<"${CURRENT_FILE}")"
fi
readonly PREVIOUS_IMAGE

# Registry credentials only live on disk for the duration of this script.
trap 'docker logout ghcr.io >/dev/null 2>&1 || log "warning: docker logout failed"' EXIT
docker login ghcr.io --username "${GHCR_USER}" --password-stdin >/dev/null
log "logged in to ghcr.io"

log "deploying ${NEW_IMAGE} (commit ${EXPECTED_SHA})"
log "previous release: ${PREVIOUS_IMAGE:-none}"

if start "${NEW_IMAGE}" && verify_release; then
  printf '%s\n' "${NEW_IMAGE}" > "${CURRENT_FILE}"
  printf '%s deploy %s %s\n' "$(date -u +%FT%TZ)" "${EXPECTED_SHA}" "${NEW_IMAGE}" >> "${HISTORY_FILE}"
  docker image prune --force >/dev/null
  log "SUCCESS: ${EXPECTED_SHA} is live"
else
  log "FAILED: new release did not become healthy"
  compose "${NEW_IMAGE}" logs --tail 50 web || log "could not read logs"
  rollback
  exit 1
fi

log "starting monitoring stack"
if start_monitoring; then
  log "monitoring OK"
  compose "${NEW_IMAGE}" ps
else
  log "MONITORING FAILED (app stays on ${EXPECTED_SHA}, no rollback)"
  compose "${NEW_IMAGE}" logs --tail 30 "${MONITORING_SERVICES[@]}" || log "could not read logs"
  exit 2
fi

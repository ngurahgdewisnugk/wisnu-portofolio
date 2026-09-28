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

start() {
  compose "$1" pull --quiet web
  compose "$1" up -d --remove-orphans --wait --wait-timeout "${WAIT_TIMEOUT}"
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
  compose "${NEW_IMAGE}" ps
else
  log "FAILED: new release did not become healthy"
  compose "${NEW_IMAGE}" logs --tail 50 web || log "could not read logs"
  rollback
  exit 1
fi

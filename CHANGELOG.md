# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- README completed for submission: project checklist, architecture diagram, dashboard
  screenshot, merge-gate proof (PR #7), measured production numbers with 3 replicas,
  troubleshooting table (8 real issues), cost and teardown.
- `docs/monitoring.md`: Grafana working set measured after the 768 MiB fix, and the
  3-replica host measurement. `docs/deployment.md`: two more troubleshooting rows.

## [0.3.2] - 2026-09-30

### Fixed
- Grafana memory limit raised from 512 MiB to 768 MiB. At 512 MiB the cgroup still hit
  its limit ~48 times a minute: the working set is ~450 MiB (280 MiB process memory +
  160 MiB of actively used files), so hot files were evicted and re-read from disk.

### Changed
- `docs/monitoring.md` memory budget uses measured working sets (cgroup `memory.stat`)
  instead of `docker stats`, and explains how to read them.
- Dashboard: the *Firing alerts* table shows "No alerts firing ✓" instead of "No data"
  when nothing is firing (panel `noValue`; empty cells still show "–").

## [0.3.1] - 2026-09-30

### Fixed
- Grafana ran at its 256 MiB memory limit: the cgroup hit it 33k times in ~8 hours
  (constant reclaim and socket throttling, no OOM kill). Limit raised to 512 MiB.

### Changed
- `docs/monitoring.md` memory budget now shows measured usage next to each limit.
- SSH tunnel command gains keep-alive and `ExitOnForwardFailure`, plus a check for a
  dropped tunnel; both issues added to the troubleshooting table.
- Grafana is now the only UI: the tunnel forwards port 3001 only, Prometheus' alert
  rules are listed in Grafana Alerting (datasource `manageAlerts`), and the docs map
  each Prometheus UI page to its Grafana equivalent. Prometheus stays bound to
  `127.0.0.1:9090` for Grafana and the deploy check.

## [0.3.0] - 2026-09-30

### Added
- Monitoring stack in `deploy/monitoring/`, deployed by the same pipeline:
  Prometheus v3.13 (LTS), Grafana 13, node_exporter, blackbox_exporter and
  nginx-prometheus-exporter. Web replicas are discovered through Docker DNS.
- Grafana dashboard as code ("Portfolio · Production overview", 21 panels): service
  health, traffic and latency, per-replica CPU/memory/event loop lag, EC2 host.
- Nine Prometheus alert rules with `promtool` unit tests.
- Nginx `stub_status` on an internal port for request and connection metrics.
- CI job "Deploy & monitoring config": compose, promtool config and rule tests,
  blackbox and Nginx config checks, dashboard JSON checks, shellcheck.
- Manual horizontal scaling through the `WEB_REPLICAS` environment variable (1–3).
- `docs/monitoring.md`: tunnel access, dashboard, alerts, log queries, scaling.

### Changed
- `deploy.sh` starts the app services first, then the monitoring stack, and fails
  the deploy (without rolling back the healthy app) if any Prometheus target is down.
- CD writes `grafana.env` from the `GRAFANA_ADMIN_PASSWORD` secret and checks that
  Prometheus and Grafana ports are closed to the internet.
- Every step in `deploy.sh`'s `start` functions now returns explicitly on failure,
  because they run inside `if` (where `set -e` is off) and now have steps after
  `compose up`.

### Fixed
- `nginx.conf` changes were not applied on deploy because the Nginx container is not
  recreated; `deploy.sh` now validates and reloads Nginx (and Prometheus) configs.

## [0.2.0] - 2026-09-29

### Added
- CD workflow: build, Trivy scan and push to GHCR, then deploy to AWS EC2 over SSH
  after CI passes on `main`; deployed by image digest with a public smoke test.
- `deploy/`: Docker Compose stack (Nginx + 2 Next.js replicas), Nginx config with
  load balancing, rate limiting, JSON access logs and `/api/metrics` blocked.
- `deploy/scripts/deploy.sh`: pull, `compose up --wait`, verify `/version`,
  automatic rollback to the previous release on failure.
- `infra/`: CloudShell scripts to create and tear down all AWS resources, and
  EC2 user data (Docker, swap, log rotation, dedicated deploy user).
- `docs/deployment.md` runbook.
- CI workflow: lint, typecheck, unit tests, build, `npm audit`, Semgrep SAST,
  gitleaks secret scan, Docker build with Trivy image scan and container smoke test.
- Unit tests for the hero code snippet (33 tests in total).

### Security
- GitHub OIDC to AWS; the deploy role can only toggle port 22 on one security group.
- SSH closed to the internet except for the runner's IP during a deploy; pinned host key.
- Container hardening: all capabilities dropped, `no-new-privileges`, memory/CPU limits.
- Removed every `innerHTML` write flagged by Semgrep: the hero code snippet and text
  animations are now rendered by React as escaped text.
- All GitHub Actions pinned to full commit SHAs; tool downloads verified by checksum.

### Removed
- Unused syntax-highlighter helpers and unused text animation styles.

## [0.1.0] - 2026-09-28

### Added
- Personal content for Ngurah Gede Wisnu, driven by a single `src/data/profile.ts`.
- Cloud & DevOps Expertise section and pinned "Portfolio with CI/CD on AWS" project.
- Ops endpoints: `/health`, `/version` (semver + commit SHA), `/api/metrics` (Prometheus).
- Unit tests with Vitest (27 tests: positive, negative, and edge cases).
- Multi-stage `Dockerfile` (Next.js standalone, non-root, no npm in runtime) and `.dockerignore`.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

### Changed
- Upgraded Next.js 14.1.0 → 15.5.26 and swiper 11 → 12 to fix critical/high advisories.
- Rewrote `/api/github/projects`: 1 GitHub API call per request instead of 1 + 2N, 15-minute cache.
- Rewrote `/api/github/contributions` with a 1-hour cache and structured error logs.
- Lint now runs through the ESLint CLI (`next lint` is deprecated).

### Security
- GitHub API routes only serve the configured owner; any other `?username=` returns 403,
  invalid topics return 400. Previously anyone could spend the server's GitHub token.
- `npm audit`: 44 vulnerabilities (3 critical) → 0.

### Removed
- Vercel deployment workflow and config (PaaS is out of scope), WakaTime, Dev.to,
  WhatsApp button, reviews, unused 3D/animation components, and 15 unused dependencies.
- All third-party photos and images; replaced with original SVG artwork.

[Unreleased]: https://github.com/ngurahgdewisnugk/wisnu-portofolio/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ngurahgdewisnugk/wisnu-portofolio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ngurahgdewisnugk/wisnu-portofolio/releases/tag/v0.1.0

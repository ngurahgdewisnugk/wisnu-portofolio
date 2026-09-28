# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

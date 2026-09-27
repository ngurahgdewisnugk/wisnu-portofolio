# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/ngurahgdewisnugk/wisnu-portofolio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ngurahgdewisnugk/wisnu-portofolio/releases/tag/v0.1.0

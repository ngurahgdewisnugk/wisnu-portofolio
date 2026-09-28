# Wisnu · Cloud Automation & Release Engineer

[![CI](https://github.com/ngurahgdewisnugk/wisnu-portofolio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ngurahgdewisnugk/wisnu-portofolio/actions/workflows/ci.yml)
[![CD](https://github.com/ngurahgdewisnugk/wisnu-portofolio/actions/workflows/cd.yml/badge.svg)](https://github.com/ngurahgdewisnugk/wisnu-portofolio/actions/workflows/cd.yml)

Personal portfolio of **Ngurah Gede Wisnu**, built as the capstone project of the
Digital Skola Cloud Engineer Bootcamp (Batch 6). The site itself is the demo: every
change goes through a CI/CD pipeline before it reaches an AWS EC2 server.

> 🚧 **Status:** app, CI, and CD to AWS done. Monitoring is being added.
> This README will be completed in Phase 5.

## Tech stack

| Layer | Tools |
| --- | --- |
| App | Next.js 15 (Pages Router + API routes), TypeScript, Tailwind CSS |
| Tests | Vitest, ESLint, `tsc` |
| Container | Docker multi-stage build, Next.js standalone output, Node 22 Alpine |
| Observability | `prom-client` metrics at `/api/metrics` |

## CI pipeline

`.github/workflows/ci.yml` runs on every push and on pull requests to `main`.
It never deploys. All jobs must pass before a change can be merged.

| Job | What it checks | Fails when |
| --- | --- | --- |
| Lint, typecheck, test, build | ESLint, `tsc --noEmit`, Vitest, `next build` | any error or lint warning |
| Dependency audit | `npm audit` against `package-lock.json` | any HIGH/CRITICAL advisory |
| SAST (Semgrep) | `p/javascript`, `p/typescript`, `p/react`, `p/secrets` | any ERROR-severity finding |
| Secret scan (gitleaks) | every commit in the git history | any secret found |
| Docker build, scan, smoke test | multi-stage build, Trivy image scan, container run | fixable HIGH/CRITICAL CVE or secret in the image, `/version` ≠ commit SHA, or container runs as root |

Supply-chain hardening: every third-party action is pinned to a full commit SHA,
and downloaded tools (gitleaks, Trivy) are checked against their published checksums.

## CD pipeline

`.github/workflows/cd.yml` runs only after CI succeeds on `main` (or manually on `main`).
Pull requests never reach it. Full runbook: [docs/deployment.md](docs/deployment.md).

| Job | Steps |
| --- | --- |
| Build, scan, push image | build the exact commit CI tested, Trivy scan, push `:<sha>` and `:latest` to GHCR |
| Deploy to EC2 | assume an AWS role via OIDC, open SSH for the runner's IP only, upload compose files, `deploy.sh` with automatic rollback, public smoke test, close SSH |

Runtime on the server: Docker Compose with Nginx (reverse proxy, load balancer,
rate limiting, JSON access logs) in front of 2 Next.js replicas. The image is
deployed by digest (`image@sha256:…`), so what runs is exactly what was scanned.

## Run locally

Requirements: Node.js 22 (see `.nvmrc`) and Docker.

```bash
cp .env.example .env        # optional: add a read-only GitHub token
npm ci
npm run dev                 # http://localhost:3000
```

Quality checks (same commands the CI pipeline runs):

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the production container:

```bash
docker build \
  --build-arg GIT_SHA=$(git rev-parse HEAD) \
  --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --build-arg VERSION=$(node -p "require('./package.json').version") \
  -t wisnu-portofolio:local .

docker run --rm -p 3000:3000 --env-file .env wisnu-portofolio:local
```

## Endpoints

| Path | Purpose |
| --- | --- |
| `/` · `/projects` · `/contact` | Portfolio pages |
| `/health` | Liveness probe (`{"status":"ok", ...}`) |
| `/version` | Semver + full commit SHA of the running image |
| `/api/metrics` | Prometheus metrics (blocked from the internet by Nginx) |
| `/api/github/projects` | Repos tagged `portfolio-project` (owner locked by config) |
| `/api/github/contributions` | Contribution calendar (needs `GITHUB_TOKEN`) |

## Environment variables

Names only; values live in `.env` locally and in GitHub Secrets in CI.

| Name | Required | Description |
| --- | --- | --- |
| `GITHUB_USERNAME` | No | GitHub owner for the Projects page (defaults to `src/data/profile.ts`) |
| `GITHUB_TOKEN` | No | Read-only token; raises rate limits and enables the contributions chart |

## Security measures

- No secrets in the repo: runtime values come from GitHub environment secrets and are
  written to the server over SSH stdin (never as command-line arguments).
- No long-lived AWS keys: GitHub OIDC with a role that can only toggle port 22 on one
  security group, and only from the `production` environment of this repo.
- SSH is closed to the internet; each deploy opens it for the runner's /32 and closes it again.
  The server's host key is pinned (`StrictHostKeyChecking yes`).
- Separate `deploy` user and key for the pipeline; admin access uses a different key.
- Gates in CI and CD: `npm audit`, Semgrep, gitleaks, Trivy. Actions pinned to commit SHAs.
- Container runs as non-root with all Linux capabilities dropped and `no-new-privileges`.
- `/api/metrics` is blocked at Nginx; API routes are rate limited.
- EC2: IMDSv2 only, encrypted EBS, CPU credits in `standard` mode, budget alert.

## Adding a project to the site

Add the topic `portfolio-project` to any public repo on GitHub. Add `highlight`
as well to feature it on the home page. No redeploy needed (cache: 15 minutes).

## Credits

Based on [adamsnows/developer-portfolio](https://github.com/adamsnows/developer-portfolio)
(MIT). Content, security fixes, tests, container, and pipeline are my own work;
see [CHANGELOG.md](CHANGELOG.md).

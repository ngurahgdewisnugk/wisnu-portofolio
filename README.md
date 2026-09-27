# Wisnu · Cloud Automation & Release Engineer

Personal portfolio of **Ngurah Gede Wisnu**, built as the capstone project of the
Digital Skola Cloud Engineer Bootcamp (Batch 6). The site itself is the demo: every
change goes through a CI/CD pipeline before it reaches an AWS EC2 server.

> 🚧 **Status:** Phase 1 (app skeleton) done. CI, CD, and monitoring are being added.
> This README will be completed in Phase 5.

## Tech stack

| Layer | Tools |
| --- | --- |
| App | Next.js 15 (Pages Router + API routes), TypeScript, Tailwind CSS |
| Tests | Vitest, ESLint, `tsc` |
| Container | Docker multi-stage build, Next.js standalone output, Node 22 Alpine |
| Observability | `prom-client` metrics at `/api/metrics` |

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

## Adding a project to the site

Add the topic `portfolio-project` to any public repo on GitHub. Add `highlight`
as well to feature it on the home page. No redeploy needed (cache: 15 minutes).

## Credits

Based on [adamsnows/developer-portfolio](https://github.com/adamsnows/developer-portfolio)
(MIT). Content, security fixes, tests, container, and pipeline are my own work;
see [CHANGELOG.md](CHANGELOG.md).

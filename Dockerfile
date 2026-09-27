# ---------- 1. deps: install exactly what package-lock.json says ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- 2. builder: compile the Next.js standalone bundle ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Injected by CI; inlined into the bundle and shown on /version.
ARG GIT_SHA=dev
ARG BUILD_TIME=""
ENV GIT_SHA=${GIT_SHA} \
    BUILD_TIME=${BUILD_TIME} \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3. runner: minimal runtime, non-root, no package manager ----------
FROM node:22-alpine AS runner
WORKDIR /app

ARG GIT_SHA=dev
ARG BUILD_TIME=""
ARG VERSION=0.0.0
LABEL org.opencontainers.image.title="wisnu-portofolio" \
      org.opencontainers.image.source="https://github.com/ngurahgdewisnugk/wisnu-portofolio" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_TIME}" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# The runtime only needs `node`. Removing npm/npx/corepack shrinks the image
# and removes their bundled dependencies from the vulnerability scan surface.
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

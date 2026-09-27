import client from "prom-client";

import { getVersionInfo } from "@/lib/version";

/**
 * Prometheus metrics shared by all API routes.
 *
 * Kept on `globalThis` so Next.js dev hot-reload does not register the
 * same metric twice (prom-client throws on duplicate names).
 */
interface AppMetrics {
  registry: client.Registry;
  githubApiRequests: client.Counter<"endpoint" | "outcome">;
  githubCache: client.Counter<"endpoint" | "result">;
}

const globalForMetrics = globalThis as unknown as {
  __appMetrics?: AppMetrics;
};

function createMetrics(): AppMetrics {
  const registry = new client.Registry();
  registry.setDefaultLabels({ app: "wisnu-portofolio" });
  client.collectDefaultMetrics({ register: registry, prefix: "portfolio_" });

  const { version, commitShort } = getVersionInfo();
  const buildInfo = new client.Gauge({
    name: "portfolio_build_info",
    help: "Build metadata of the running container; value is always 1.",
    labelNames: ["version", "commit"],
    registers: [registry],
  });
  buildInfo.set({ version, commit: commitShort }, 1);

  const githubApiRequests = new client.Counter({
    name: "portfolio_github_api_requests_total",
    help: "Outgoing requests to the GitHub API by endpoint and outcome.",
    labelNames: ["endpoint", "outcome"],
    registers: [registry],
  });

  const githubCache = new client.Counter({
    name: "portfolio_github_cache_total",
    help: "In-memory cache lookups for GitHub data (hit or miss).",
    labelNames: ["endpoint", "result"],
    registers: [registry],
  });

  return { registry, githubApiRequests, githubCache };
}

export const metrics: AppMetrics =
  globalForMetrics.__appMetrics ?? (globalForMetrics.__appMetrics = createMetrics());

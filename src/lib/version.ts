import pkg from "../../package.json";

export interface VersionInfo {
  /** Semantic version from package.json. */
  version: string;
  /** Full git commit SHA baked into the image at build time. */
  commit: string;
  /** Short SHA for display. */
  commitShort: string;
  /** ISO timestamp of the image build. */
  buildTime: string;
}

type Env = Record<string, string | undefined>;

/**
 * Literal `process.env.X` references so Next.js can inline them at build
 * time (see `env` in next.config.mjs). Server and browser then render the
 * same value and hydration stays consistent.
 */
const buildEnv: Env = {
  APP_VERSION: process.env.APP_VERSION,
  GIT_SHA: process.env.GIT_SHA,
  BUILD_TIME: process.env.BUILD_TIME,
};

const SHA_RE = /^[0-9a-f]{7,40}$/i;

/**
 * Build metadata injected by the Dockerfile (`GIT_SHA`, `BUILD_TIME`).
 * Falls back to "dev" for local runs.
 */
export function getVersionInfo(env: Env = buildEnv): VersionInfo {
  const rawSha = env.GIT_SHA?.trim() ?? "";
  const commit = SHA_RE.test(rawSha) ? rawSha.toLowerCase() : "dev";

  return {
    version: env.APP_VERSION?.trim() || pkg.version,
    commit,
    commitShort: commit === "dev" ? "dev" : commit.slice(0, 7),
    buildTime: env.BUILD_TIME?.trim() || "unknown",
  };
}

/**
 * Pure helpers for the GitHub-backed API routes.
 * No network calls live here so every function can be unit-tested.
 */

/** GitHub username rules: 1-39 chars, alphanumeric or single hyphens, no leading/trailing hyphen. */
export const GITHUB_USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** GitHub topic rules: lowercase letters, numbers and hyphens, max 50 chars. */
export const GITHUB_TOPIC_RE = /^[a-z0-9][a-z0-9-]{0,49}$/;

export class GithubConfigError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GithubConfigError";
    this.status = status;
  }
}

/**
 * Returns the only username this server is allowed to query.
 *
 * The server holds a GitHub token, so accepting any `?username=` from the
 * browser would let anyone spend our rate limit on arbitrary accounts.
 * The query param is still accepted for backwards compatibility, but it must
 * match the configured owner.
 */
export function resolveGithubUsername(
  requested: string | null | undefined,
  configured: string | null | undefined
): string {
  const owner = configured?.trim();
  if (!owner || !GITHUB_USERNAME_RE.test(owner)) {
    throw new GithubConfigError("GitHub username is not configured", 500);
  }

  const asked = requested?.trim();
  if (asked && asked.toLowerCase() !== owner.toLowerCase()) {
    throw new GithubConfigError("Username is not allowed", 403);
  }

  return owner;
}

export function resolveTopic(
  requested: string | null | undefined,
  fallback: string
): string {
  const topic = (requested ?? "").trim() || fallback;
  if (!GITHUB_TOPIC_RE.test(topic)) {
    throw new GithubConfigError("Invalid topic", 400);
  }
  return topic;
}

export interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  language?: string | null;
  fork?: boolean;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioProject {
  image: string;
  category: string;
  name: string;
  description: string;
  link: string;
  github: string;
  language?: string;
  tags: string[];
  createdAt?: string;
}

/** Topics that only drive categorisation; hidden from the tag list. */
const CATEGORY_ONLY_TOPICS = new Set([
  "backend",
  "back-end",
  "frontend",
  "front-end",
  "fullstack",
  "full-stack",
  "portfolio-project",
  "highlight",
]);

const CATEGORY_RULES: Array<{ category: string; topics: string[] }> = [
  { category: "Cloud", topics: ["aws", "gcp", "azure", "cloud"] },
  {
    category: "DevOps",
    topics: ["devops", "ci-cd", "cicd", "kubernetes", "docker", "terraform"],
  },
  { category: "IoT", topics: ["iot", "mqtt", "edge-computing"] },
  { category: "Full stack", topics: ["fullstack", "full-stack"] },
  { category: "Back end", topics: ["backend", "back-end", "api"] },
  { category: "Front end", topics: ["frontend", "front-end"] },
];

export function determineCategory(topics: readonly string[] = []): string {
  const normalized = topics.map((t) => t.toLowerCase());
  const match = CATEGORY_RULES.find((rule) =>
    rule.topics.some((t) => normalized.includes(t))
  );
  return match?.category ?? "Other";
}

/** Keeps non-archived repos carrying `topic`, newest first. */
export function selectReposByTopic(
  repos: readonly GithubRepo[],
  topic: string
): GithubRepo[] {
  return repos
    .filter((repo) => !repo.archived)
    .filter((repo) => (repo.topics ?? []).includes(topic))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export function formatRepo(repo: GithubRepo, owner: string): PortfolioProject {
  const topics = repo.topics ?? [];
  return {
    image: `https://opengraph.githubassets.com/1/${owner}/${repo.name}`,
    category: determineCategory(topics),
    name: repo.name.replace(/[-_]/g, " "),
    description: repo.description ?? "No description yet.",
    link: repo.homepage ?? "",
    github: repo.html_url,
    language: repo.language ? repo.language.toLowerCase() : undefined,
    tags: topics.filter((t) => !CATEGORY_ONLY_TOPICS.has(t.toLowerCase())),
    createdAt: repo.created_at,
  };
}

export function githubHeaders(token: string | undefined): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "wisnu-portofolio",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

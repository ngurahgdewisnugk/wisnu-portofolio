import { NextRequest, NextResponse } from "next/server";

import { profile } from "@/data/profile";
import {
  formatRepo,
  GithubConfigError,
  githubHeaders,
  GithubRepo,
  PortfolioProject,
  resolveGithubUsername,
  resolveTopic,
  selectReposByTopic,
} from "@/lib/github";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 15 * 60 * 1000;
const ENDPOINT = "projects";

interface CacheEntry {
  expiresAt: number;
  repos: GithubRepo[];
}

// One entry per owner; the owner is locked by config so this stays tiny.
const repoCache = new Map<string, CacheEntry>();

async function fetchRepos(owner: string): Promise<GithubRepo[]> {
  const cached = repoCache.get(owner);
  if (cached && cached.expiresAt > Date.now()) {
    metrics.githubCache.inc({ endpoint: ENDPOINT, result: "hit" });
    return cached.repos;
  }
  metrics.githubCache.inc({ endpoint: ENDPOINT, result: "miss" });

  // The list endpoint already includes `topics` and `language`,
  // so one call replaces the old 1 + 2N calls per request.
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated&type=owner`,
    { headers: githubHeaders(process.env.GITHUB_TOKEN), cache: "no-store" }
  );

  if (!response.ok) {
    metrics.githubApiRequests.inc({
      endpoint: ENDPOINT,
      outcome: response.status === 403 || response.status === 429 ? "rate_limited" : "error",
    });
    // Serve stale data rather than an empty page when GitHub is unhappy.
    if (cached) return cached.repos;
    throw new Error(`GitHub API responded ${response.status}`);
  }

  metrics.githubApiRequests.inc({ endpoint: ENDPOINT, outcome: "success" });
  const repos = (await response.json()) as GithubRepo[];
  repoCache.set(owner, { repos, expiresAt: Date.now() + CACHE_TTL_MS });
  return repos;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  let owner: string;
  let topic: string;
  try {
    owner = resolveGithubUsername(
      params.get("username"),
      process.env.GITHUB_USERNAME || profile.githubUsername
    );
    topic = resolveTopic(params.get("portfolioTag"), profile.portfolioTopic);
  } catch (error) {
    if (error instanceof GithubConfigError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  try {
    const repos = await fetchRepos(owner);
    const projects: PortfolioProject[] = selectReposByTopic(repos, topic).map(
      (repo) => formatRepo(repo, owner)
    );
    return NextResponse.json(projects, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "github_projects_failed",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Failed to fetch GitHub projects" },
      { status: 502 }
    );
  }
}

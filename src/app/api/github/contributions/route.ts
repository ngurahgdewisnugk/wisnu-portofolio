import { NextRequest, NextResponse } from "next/server";

import { profile } from "@/data/profile";
import {
  GithubConfigError,
  githubHeaders,
  resolveGithubUsername,
} from "@/lib/github";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60 * 60 * 1000;
const ENDPOINT = "contributions";

const QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`;

interface ContributionsPayload {
  username: string;
  totalContributions: number;
  contributions: Record<string, number>;
  startDate: string;
  endDate: string;
}

interface ContributionDay {
  date: string;
  contributionCount: number;
}

let cache: { expiresAt: number; data: ContributionsPayload } | undefined;

async function fetchContributions(
  username: string,
  token: string
): Promise<ContributionsPayload> {
  if (cache && cache.expiresAt > Date.now() && cache.data.username === username) {
    metrics.githubCache.inc({ endpoint: ENDPOINT, result: "hit" });
    return cache.data;
  }
  metrics.githubCache.inc({ endpoint: ENDPOINT, result: "miss" });

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { username } }),
    cache: "no-store",
  });

  const body = response.ok ? await response.json() : undefined;
  const calendar =
    body?.data?.user?.contributionsCollection?.contributionCalendar;

  if (!calendar) {
    metrics.githubApiRequests.inc({ endpoint: ENDPOINT, outcome: "error" });
    if (cache) return cache.data; // stale is better than empty
    throw new Error(`GitHub GraphQL responded ${response.status}`);
  }
  metrics.githubApiRequests.inc({ endpoint: ENDPOINT, outcome: "success" });

  const contributions: Record<string, number> = {};
  for (const week of calendar.weeks as { contributionDays: ContributionDay[] }[]) {
    for (const day of week.contributionDays) {
      contributions[day.date] = day.contributionCount;
    }
  }
  const dates = Object.keys(contributions).sort();

  const data: ContributionsPayload = {
    username,
    totalContributions: calendar.totalContributions,
    contributions,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  };
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export async function GET(request: NextRequest) {
  let username: string;
  try {
    username = resolveGithubUsername(
      request.nextUrl.searchParams.get("username"),
      process.env.GITHUB_USERNAME || profile.githubUsername
    );
  } catch (error) {
    if (error instanceof GithubConfigError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  // The contributions calendar is only available through GraphQL,
  // which always requires a token.
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token is not configured" },
      { status: 503 }
    );
  }

  try {
    const data = await fetchContributions(username, token);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "github_contributions_failed",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Failed to fetch GitHub contributions" },
      { status: 502 }
    );
  }
}

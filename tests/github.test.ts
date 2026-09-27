import { describe, expect, it } from "vitest";

import {
  determineCategory,
  formatRepo,
  GithubConfigError,
  GithubRepo,
  resolveGithubUsername,
  resolveTopic,
  selectReposByTopic,
} from "@/lib/github";

const OWNER = "ngurahgdewisnugk";

function repo(overrides: Partial<GithubRepo>): GithubRepo {
  return {
    name: "sample-repo",
    description: "Sample",
    html_url: `https://github.com/${OWNER}/sample-repo`,
    homepage: null,
    topics: [],
    language: "Python",
    archived: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveGithubUsername", () => {
  it("returns the configured owner when no username is requested (positive)", () => {
    expect(resolveGithubUsername(null, OWNER)).toBe(OWNER);
  });

  it("accepts the owner in a different letter case (edge case)", () => {
    expect(resolveGithubUsername("NgurahGdeWisnuGK", OWNER)).toBe(OWNER);
  });

  it("rejects any other username with 403 (negative)", () => {
    expect(() => resolveGithubUsername("torvalds", OWNER)).toThrowError(
      expect.objectContaining({ status: 403 })
    );
  });

  it("fails closed with 500 when the owner is not configured (negative)", () => {
    expect(() => resolveGithubUsername(null, "")).toThrowError(GithubConfigError);
    expect(() => resolveGithubUsername(null, undefined)).toThrowError(
      expect.objectContaining({ status: 500 })
    );
  });

  it("rejects a configured owner that is not a valid GitHub login (edge case)", () => {
    expect(() => resolveGithubUsername(null, "../../etc")).toThrowError(
      expect.objectContaining({ status: 500 })
    );
  });
});

describe("resolveTopic", () => {
  it("falls back to the default topic (positive)", () => {
    expect(resolveTopic(null, "portfolio-project")).toBe("portfolio-project");
  });

  it("rejects topics with characters GitHub does not allow (negative)", () => {
    expect(() => resolveTopic("x&per_page=1000", "portfolio-project")).toThrowError(
      expect.objectContaining({ status: 400 })
    );
  });
});

describe("selectReposByTopic", () => {
  const repos = [
    repo({ name: "old", topics: ["portfolio-project"], created_at: "2025-01-01T00:00:00Z" }),
    repo({ name: "new", topics: ["portfolio-project"], created_at: "2026-06-01T00:00:00Z" }),
    repo({ name: "untagged", topics: ["aws"] }),
    repo({ name: "archived", topics: ["portfolio-project"], archived: true }),
    repo({ name: "no-topics", topics: undefined }),
  ];

  it("keeps only tagged, non-archived repos, newest first (positive)", () => {
    expect(selectReposByTopic(repos, "portfolio-project").map((r) => r.name)).toEqual([
      "new",
      "old",
    ]);
  });

  it("returns an empty list when nothing matches (edge case)", () => {
    expect(selectReposByTopic(repos, "highlight")).toEqual([]);
    expect(selectReposByTopic([], "portfolio-project")).toEqual([]);
  });
});

describe("determineCategory", () => {
  it.each([
    [["aws", "terraform"], "Cloud"],
    [["docker", "ci-cd"], "DevOps"],
    [["mqtt", "python"], "IoT"],
    [["Frontend"], "Front end"],
  ])("maps %j to %s (positive)", (topics, expected) => {
    expect(determineCategory(topics)).toBe(expected);
  });

  it("returns 'Other' for unknown or missing topics (edge case)", () => {
    expect(determineCategory(["random"])).toBe("Other");
    expect(determineCategory()).toBe("Other");
  });
});

describe("formatRepo", () => {
  it("builds a project card from a repo (positive)", () => {
    const project = formatRepo(
      repo({
        name: "energy-monitoring_iot",
        topics: ["portfolio-project", "aws", "iot"],
        homepage: "https://example.com",
      }),
      OWNER
    );

    expect(project).toMatchObject({
      name: "energy monitoring iot",
      category: "Cloud",
      language: "python",
      link: "https://example.com",
      tags: ["aws", "iot"],
    });
    expect(project.image).toBe(
      `https://opengraph.githubassets.com/1/${OWNER}/energy-monitoring_iot`
    );
  });

  it("fills safe defaults for missing fields (edge case)", () => {
    const project = formatRepo(
      repo({ description: null, homepage: null, language: null, topics: undefined }),
      OWNER
    );

    expect(project.description).toBe("No description yet.");
    expect(project.link).toBe("");
    expect(project.language).toBeUndefined();
    expect(project.tags).toEqual([]);
  });
});

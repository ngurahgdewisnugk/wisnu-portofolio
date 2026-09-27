import { describe, expect, it } from "vitest";

import pkg from "../package.json";
import { getVersionInfo } from "@/lib/version";
import handler from "@/pages/api/version";

import { createMocks } from "./helpers";

const SHA = "3f9c2e1a7b8d4c6e0f1a2b3c4d5e6f708192a3b4";

describe("getVersionInfo", () => {
  it("uses the injected commit SHA and build time (positive)", () => {
    const info = getVersionInfo({ GIT_SHA: SHA, BUILD_TIME: "2026-09-28T00:00:00Z" });

    expect(info.commit).toBe(SHA);
    expect(info.commitShort).toBe("3f9c2e1");
    expect(info.version).toBe(pkg.version);
    expect(info.buildTime).toBe("2026-09-28T00:00:00Z");
  });

  it("falls back to 'dev' when no SHA is injected (edge case)", () => {
    const info = getVersionInfo({});

    expect(info.commit).toBe("dev");
    expect(info.commitShort).toBe("dev");
    expect(info.buildTime).toBe("unknown");
  });

  it("refuses values that are not a git SHA (negative)", () => {
    const info = getVersionInfo({ GIT_SHA: "<script>alert(1)</script>" });
    expect(info.commit).toBe("dev");
  });

  it("normalises an upper-case SHA to lower case (edge case)", () => {
    expect(getVersionInfo({ GIT_SHA: SHA.toUpperCase() }).commit).toBe(SHA);
  });
});

describe("GET /api/version", () => {
  it("returns version info as JSON (positive)", () => {
    const { req, res, result } = createMocks("GET");
    handler(req, res);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ version: pkg.version });
  });

  it("rejects DELETE with 405 (negative)", () => {
    const { req, res, result } = createMocks("DELETE");
    handler(req, res);
    expect(result.statusCode).toBe(405);
  });
});

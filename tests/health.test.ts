import { describe, expect, it } from "vitest";

import handler, { HealthResponse } from "@/pages/api/health";

import { createMocks } from "./helpers";

describe("GET /api/health", () => {
  it("returns 200 with status ok (positive)", () => {
    const { req, res, result } = createMocks("GET");
    handler(req, res);

    expect(result.statusCode).toBe(201);
    const body = result.body as HealthResponse;
    expect(body.status).toBe("ok");
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(result.headers["cache-control"]).toBe("no-store");
  });

  it("supports HEAD for lightweight probes (edge case)", () => {
    const { req, res, result } = createMocks("HEAD");
    handler(req, res);
    expect(result.statusCode).toBe(200);
  });

  it("rejects POST with 405 and an Allow header (negative)", () => {
    const { req, res, result } = createMocks("POST");
    handler(req, res);

    expect(result.statusCode).toBe(405);
    expect(result.headers["allow"]).toBe("GET, HEAD");
  });
});

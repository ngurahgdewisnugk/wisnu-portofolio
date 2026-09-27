import { describe, expect, it } from "vitest";

import handler from "@/pages/api/metrics";

import { createMocks } from "./helpers";

describe("GET /api/metrics", () => {
  it("exposes Prometheus text format with build info (positive)", async () => {
    const { req, res, result } = createMocks("GET");
    await handler(req, res);

    expect(result.statusCode).toBe(200);
    expect(result.headers["content-type"]).toContain("text/plain");
    expect(String(result.body)).toContain("portfolio_build_info");
    expect(String(result.body)).toContain("portfolio_process_cpu_seconds_total");
  });

  it("rejects POST with 405 (negative)", async () => {
    const { req, res, result } = createMocks("POST");
    await handler(req, res);
    expect(result.statusCode).toBe(405);
  });
});

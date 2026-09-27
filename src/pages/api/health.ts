import type { NextApiRequest, NextApiResponse } from "next";

import { getVersionInfo } from "@/lib/version";

export interface HealthResponse {
  status: "ok";
  version: string;
  commit: string;
  uptimeSeconds: number;
  timestamp: string;
}

/**
 * Liveness probe used by the Docker healthcheck, the CD smoke test,
 * and Prometheus blackbox_exporter. Deliberately has no external
 * dependencies (no GitHub call) so it only fails when the app itself does.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { version, commitShort } = getVersionInfo();
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    status: "ok",
    version,
    commit: commitShort,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

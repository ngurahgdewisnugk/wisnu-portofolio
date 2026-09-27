import type { NextApiRequest, NextApiResponse } from "next";

import { metrics } from "@/lib/metrics";

/**
 * Prometheus scrape endpoint. Nginx blocks /api/metrics from the internet;
 * only Prometheus on the internal Docker network can reach it.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  res.setHeader("Content-Type", metrics.registry.contentType);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(await metrics.registry.metrics());
}

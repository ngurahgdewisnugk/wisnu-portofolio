import type { NextApiRequest, NextApiResponse } from "next";

import { getVersionInfo, VersionInfo } from "@/lib/version";

/**
 * Exposes exactly what is running: semver from package.json and the full
 * commit SHA the image was built from. The CD smoke test compares `commit`
 * with `github.sha` to prove the new release is live.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<VersionInfo | { error: string }>
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(getVersionInfo());
}

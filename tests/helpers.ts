import type { NextApiRequest, NextApiResponse } from "next";

export interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

/** Minimal stand-in for Next.js API route req/res objects. */
export function createMocks(method = "GET") {
  const result: MockResponse = { statusCode: 200, headers: {}, body: undefined };

  const res = {
    status(code: number) {
      result.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      result.headers[name.toLowerCase()] = value;
      return res;
    },
    json(payload: unknown) {
      result.body = payload;
      return res;
    },
    send(payload: unknown) {
      result.body = payload;
      return res;
    },
    end() {
      return res;
    },
  };

  const req = { method, query: {}, headers: {} };

  return {
    req: req as unknown as NextApiRequest,
    res: res as unknown as NextApiResponse,
    result,
  };
}

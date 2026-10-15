import type { Config } from "@netlify/functions";

// Stub so the deploy pipeline exists from phase 1. Implemented in phase 6.
export default async (): Promise<Response> =>
  Response.json({ error: "not_implemented" }, { status: 501 });

export const config: Config = {
  path: "/api/analyze-bill",
  method: "POST",
};

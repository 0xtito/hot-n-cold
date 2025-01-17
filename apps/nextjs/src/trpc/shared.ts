import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

import type { AppRouter } from "@zkarcade/api";

export const transformer = superjson;

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url

  switch (process.env.VERCEL_ENV) {
    case "production":
      return "https://zkarcade.vixuslabs.com";
    case "preview":
      return `https://${process.env.VERCEL_URL}`;
    default:
      return `http://localhost:${process.env.PORT ?? 3000}`;
  }
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

import { createRemoteJWKSet } from "jose-cjs";

if (!process.env.CLIENT_URL) {
  throw new Error("CLIENT_URL environment variable is not set");
}

export const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);
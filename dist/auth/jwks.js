"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWKS = void 0;
const jose_cjs_1 = require("jose-cjs");
if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL environment variable is not set");
}
exports.JWKS = (0, jose_cjs_1.createRemoteJWKSet)(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

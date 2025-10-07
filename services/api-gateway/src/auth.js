import { createRemoteJWKSet, jwtVerify } from "jose";
const DEV_BYPASS = (process.env.DEV_AUTH_BYPASS ?? "false") === "true";
const ISSUER = process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/` : "";
const AUDIENCE = process.env.AUTH0_AUDIENCE || "";
// Lazy JWKS initialization
let jwks = null;
function getJWKS() {
    if (!jwks && ISSUER) {
        jwks = createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`));
    }
    return jwks;
}
export function required(name) {
    if (!DEV_BYPASS && !process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}
export async function authGuard(req, reply) {
    if (DEV_BYPASS)
        return;
    try {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token)
            throw new Error("no token");
        const jwks = getJWKS();
        if (!jwks)
            throw new Error("JWKS not available");
        const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER, audience: AUDIENCE });
        req.user = payload;
    }
    catch (error) {
        // Log concise warning without token details
        console.warn("Auth verification failed:", error instanceof Error ? error.message : "unknown error");
        return reply.code(401).send({ error: "unauthorized" });
    }
}

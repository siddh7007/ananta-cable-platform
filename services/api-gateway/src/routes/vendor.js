import { authGuard } from "../auth.js";
import { UpstreamUnavailable } from "../errors.js";
const vendorRoutes = (fastify, _opts, done) => {
    fastify.get("/v1/vendor/mouser/ping", {
        preHandler: [authGuard],
        config: { rateLimit: {} }
    }, async (req, reply) => {
        if (!isDevVendorEnabled()) {
            return reply.code(404).send({
                error: "not_found",
                message: "Vendor endpoints are disabled"
            });
        }
        try {
            const response = await fetch(buildVendorUrl(), {
                method: "GET",
                headers: buildForwardHeaders(req)
            });
            const payload = await parseJson(response);
            if (!response.ok) {
                if (response.status === 404) {
                    return reply.code(404).send(payload ?? {
                        error: "not_found",
                        message: "Vendor ping is unavailable"
                    });
                }
                fastify.log.error({
                    msg: "Vendor ping upstream error",
                    status: response.status,
                    statusText: response.statusText,
                    payload
                });
                throw new UpstreamUnavailable("vendor upstream unavailable");
            }
            reply.header("cache-control", "no-store");
            return payload;
        }
        catch (error) {
            fastify.log.error({ error }, "Vendor ping proxy request failed");
            throw new UpstreamUnavailable("vendor upstream unavailable");
        }
    });
    done();
};
function isDevVendorEnabled() {
    return (process.env.DEV_VENDOR ?? "false") === "true";
}
function buildVendorUrl() {
    const baseUrl = process.env.BFF_PORTAL_URL || "http://localhost:4001";
    return `${baseUrl.replace(/\/$/, "")}/v1/vendor/mouser/ping`;
}
function buildForwardHeaders(req) {
    const headers = {
        "accept": "application/json",
        "content-type": "application/json"
    };
    if (req.headers.authorization) {
        headers["authorization"] = req.headers.authorization;
    }
    const requestId = req.headers["x-request-id"];
    if (typeof requestId === "string") {
        headers["x-request-id"] = requestId;
    }
    return headers;
}
async function parseJson(response) {
    try {
        // Response body can only be read once
        const text = await response.text();
        if (!text) {
            return null;
        }
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
export default vendorRoutes;

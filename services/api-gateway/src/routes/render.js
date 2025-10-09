import { authGuard } from "../auth.js";
import { UpstreamUnavailable } from '../errors.js';
const BFF_PORTAL_URL = process.env.BFF_PORTAL_URL || 'http://localhost:4001';
const renderRoutes = (fastify, opts, done) => {
    console.log('[Render Routes] Registering render routes...');
    console.log('[Render Routes] BFF_PORTAL_URL:', BFF_PORTAL_URL);
    // GET /v1/template-packs - Proxy to BFF Portal
    fastify.get("/v1/template-packs", {
        preHandler: [authGuard],
        config: { rateLimit: {} }
    }, async (req, reply) => {
        try {
            const requestId = req.headers['x-request-id'];
            console.log('[Render Routes] Proxying template-packs request to:', `${BFF_PORTAL_URL}/v1/template-packs`);
            const response = await fetch(`${BFF_PORTAL_URL}/v1/template-packs`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || '',
                    'x-request-id': requestId,
                },
            });
            if (!response.ok) {
                throw new Error(`BFF Portal returned ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('[Render Routes] Received template packs:', data);
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ error }, 'Failed to fetch template packs from BFF Portal');
            throw new UpstreamUnavailable('template-packs unavailable');
        }
    });
    // POST /v1/render - Render a drawing (proxy to BFF Portal)
    fastify.post("/v1/render", {
        preHandler: [authGuard],
        config: { rateLimit: {} }
    }, async (req, reply) => {
        try {
            const requestId = req.headers['x-request-id'];
            console.log('[Render Routes] Proxying render request to:', `${BFF_PORTAL_URL}/v1/render`);
            const response = await fetch(`${BFF_PORTAL_URL}/v1/render`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || '',
                    'x-request-id': requestId,
                },
                body: JSON.stringify(req.body),
            });
            if (!response.ok) {
                const errorData = await response.json();
                fastify.log.error({ status: response.status, errorData }, 'BFF Portal render failed');
                return reply.code(response.status).send(errorData);
            }
            const result = await response.json();
            console.log('[Render Routes] Render completed successfully');
            return reply.send(result);
        }
        catch (error) {
            fastify.log.error({ error, url: `${BFF_PORTAL_URL}/v1/render` }, 'Failed to render drawing');
            throw new UpstreamUnavailable('renderer unreachable');
        }
    });
    console.log('[Render Routes] Routes registered successfully');
    done();
};
export default renderRoutes;

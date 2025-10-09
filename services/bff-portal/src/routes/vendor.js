import { MouserClient } from '../vendor/mouser.js';
const vendorPingSchema = {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    service: { type: 'string' },
                    vendors: {
                        type: 'object',
                        properties: {
                            mouser: {
                                type: 'object',
                                properties: {
                                    configured: { type: 'boolean' },
                                    status: { type: 'string' }
                                },
                                required: ['configured', 'status']
                            }
                        },
                        required: ['mouser']
                    }
                },
                required: ['status', 'service', 'vendors']
            },
            404: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    message: { type: 'string' }
                },
                required: ['error', 'message']
            }
        }
    }
};
const isDevVendorEnabled = () => (process.env.DEV_VENDOR ?? 'false') === 'true';
const buildVendorPingResponse = (mouserClient) => {
    const mouserConfigured = mouserClient.isConfigured();
    const mouserStatus = mouserConfigured ? 'configured' : 'not_configured';
    return {
        status: 'ok',
        service: 'vendor-integration',
        vendors: {
            mouser: {
                configured: mouserConfigured,
                status: mouserStatus
            }
        }
    };
};
/**
 * Vendor routes for external vendor integrations
 * Currently supports Mouser Electronics
 */
export async function vendorRoutes(server, options = {}) {
    const mouserClient = options.mouserClient || new MouserClient();
    const registerPingRoute = (path) => {
        server.get(path, vendorPingSchema, async (_request, reply) => {
            if (!isDevVendorEnabled()) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Vendor development endpoints are disabled'
                });
            }
            return buildVendorPingResponse(mouserClient);
        });
    };
    registerPingRoute('/vendor/ping');
    registerPingRoute('/v1/vendor/mouser/ping');
}

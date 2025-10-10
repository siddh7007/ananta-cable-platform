import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { MouserClient } from '../vendor/mouser.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: { sub: string };
}

export interface VendorRouteOptions {
  mouserClient?: MouserClient;
}

type VendorPingResponse = {
  status: string;
  service: string;
  vendors: {
    mouser: {
      configured: boolean;
      status: string;
    };
  };
};

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
                  status: { type: 'string' },
                },
                required: ['configured', 'status'],
              },
            },
            required: ['mouser'],
          },
        },
        required: ['status', 'service', 'vendors'],
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['error', 'message'],
      },
    },
  },
} as const;

function isDevVendorEnabled(): boolean {
  return (process.env.DEV_VENDOR ?? 'false') === 'true';
}

function buildVendorPingResponse(mouserClient: MouserClient): VendorPingResponse {
  const mouserConfigured = mouserClient.isConfigured();
  const mouserStatus = mouserConfigured ? 'configured' : 'not_configured';

  return {
    status: 'ok',
    service: 'vendor-integration',
    vendors: {
      mouser: {
        configured: mouserConfigured,
        status: mouserStatus,
      },
    },
  };
}

/**
 * Vendor routes for external vendor integrations
 * Currently supports Mouser Electronics
 */
export async function vendorRoutes(server: FastifyInstance, options: VendorRouteOptions = {}) {
  const mouserClient = options.mouserClient || new MouserClient();

  const registerPingRoute = (path: string) => {
    server.get(
      path,
      vendorPingSchema,
      async (_request: AuthenticatedRequest, reply: FastifyReply) => {
        if (!isDevVendorEnabled()) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Vendor development endpoints are disabled',
          });
        }

        return buildVendorPingResponse(mouserClient);
      },
    );
  };

  registerPingRoute('/vendor/ping');
  registerPingRoute('/v1/vendor/mouser/ping');
}

import { ConnectorsDAO } from '../dao/connectors.js';
const connectorsDao = new ConnectorsDAO();
export async function connectorRoutes(fastify) {
    // GET /v1/md/search/connectors - Search connectors
    fastify.get('/v1/md/search/connectors', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string' },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                },
                required: ['q']
            }
        },
        handler: async (request, reply) => {
            const { q, limit = 20 } = request.query;
            try {
                const connectors = await connectorsDao.searchConnectors(q, limit);
                return reply.send(connectors);
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    });
    // GET /v1/md/connector/{mpn} - Get connector metadata
    fastify.get('/v1/md/connector/:mpn', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    mpn: { type: 'string' }
                },
                required: ['mpn']
            }
        },
        handler: async (request, reply) => {
            const { mpn } = request.params;
            try {
                const connector = await connectorsDao.getConnectorMetadata(mpn);
                if (!connector) {
                    return reply.status(404).send({ error: 'Connector not found' });
                }
                return reply.send(connector);
            }
            catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    });
}

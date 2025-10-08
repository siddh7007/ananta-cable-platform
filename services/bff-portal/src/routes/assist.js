// Static locale color data - in production, this could be more sophisticated
const LOCALE_COLORS = {
    NA: {
        colors: {
            L: '#000000',
            N: '#FFFFFF',
            PE: '#00FF00' // Green for Protective Earth
        },
        notes: [
            'North American color coding follows NEC standards',
            'Green or Green/Yellow for ground connections',
            'Black for hot/line conductors'
        ]
    },
    EU: {
        colors: {
            L: '#2E8B57',
            N: '#0000FF',
            PE: '#00FF00' // Green/Yellow for Protective Earth
        },
        notes: [
            'European color coding follows IEC 60446 standards',
            'Green/Yellow stripe for protective earth',
            'Brown for phase/live conductors'
        ]
    },
    JP: {
        colors: {
            L: '#000000',
            N: '#FFFFFF',
            PE: '#00FF00' // Green for Protective Earth
        },
        notes: [
            'Japanese color coding follows JIS standards',
            'Similar to North American standards with some variations'
        ]
    },
    Other: {
        colors: {
            L: '#8B4513',
            N: '#0000FF',
            PE: '#00FF00' // Green for Protective Earth
        },
        notes: [
            'Generic international color coding',
            'Consult local electrical codes for specific requirements'
        ]
    }
};
export async function assistRoutes(fastify) {
    // GET /v1/assist/locale-colors - Get locale-specific wire colors
    fastify.get('/v1/assist/locale-colors', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    region: { type: 'string', enum: ['NA', 'EU', 'JP', 'Other'] }
                },
                required: ['region']
            }
        },
        handler: async (request, reply) => {
            const { region } = request.query;
            const colors = LOCALE_COLORS[region];
            if (!colors) {
                return reply.status(400).send({ error: 'Invalid region' });
            }
            return reply.send(colors);
        }
    });
}

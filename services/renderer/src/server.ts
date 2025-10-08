import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { renderToSVG } from './renderer/index.js';
import { RenderRequest, RenderResponse } from './types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
let version = '0.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  version = pkg.version;
} catch {
  // Use default version
}

const PORT = parseInt(process.env.PORT || '5002', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Zod schemas for validation
const RenderRequestSchema = z.object({
  dsl: z.object({
    meta: z.object({
      assembly_id: z.string(),
      schema_hash: z.string(),
      created_at: z.string().optional(),
    }),
    dimensions: z.object({
      oal_mm: z.number().positive(),
      tolerance_mm: z.number().min(0),
      broken_dim: z.boolean().optional(),
    }),
    cable: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('ribbon'),
        ways: z.number().int().positive(),
        pitch_in: z.number().positive(),
        red_stripe: z.boolean().optional(),
      }),
      z.object({
        type: z.literal('round'),
        conductors: z.number().int().positive(),
        awg: z.number().int().optional(),
        shield: z.enum(['none', 'foil', 'braid', 'foil_braid']).optional(),
      }),
    ]),
    endA: z.object({
      connector_mpn: z.string(),
      type: z.enum(['idc', 'crimp', 'solder', 'ring_lug']),
      positions: z.number().int().positive(),
      orientation: z.enum(['horizontal', 'vertical']).optional(),
      pin_numbering: z.enum(['sequential', 'dual_row']).optional(),
    }),
    endB: z.object({
      connector_mpn: z.string(),
      type: z.enum(['idc', 'crimp', 'solder', 'ring_lug']),
      positions: z.number().int().positive(),
      orientation: z.enum(['horizontal', 'vertical']).optional(),
      pin_numbering: z.enum(['sequential', 'dual_row']).optional(),
    }),
    nets: z.array(
      z.object({
        circuit: z.string(),
        endA_pin: z.string(),
        endB_pin: z.string(),
        color: z.string().optional(),
        shield: z.enum(['none', 'fold_back', 'isolated', 'pigtail']).optional(),
      })
    ),
    labels: z.array(
      z.object({
        text: z.string(),
        anchor: z.enum(['endA', 'endB', 'cable', 'dimension']),
        offset_x: z.number().optional(),
        offset_y: z.number().optional(),
      })
    ),
    notesPack: z.string(),
    qr: z.string().optional(),
  }),
  templatePackId: z.string(),
  format: z.enum(['svg', 'pdf', 'png']).optional().default('svg'),
});

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Health check
fastify.get('/health', async () => {
  return {
    ok: true,
    version,
    uptime: process.uptime(),
  };
});

// Metrics stub
fastify.get('/metrics', async () => {
  return {
    renderer_requests_total: 0,
    renderer_errors_total: 0,
    renderer_duration_seconds: 0,
  };
});

// Render endpoint
fastify.post<{ Body: RenderRequest }>('/render', async (request, reply) => {
  try {
    // Validate request
    const validated = RenderRequestSchema.parse(request.body);

    // Render to SVG
    const startTime = Date.now();
    const svg = await renderToSVG(validated.dsl, validated.templatePackId);
    const duration = Date.now() - startTime;

    fastify.log.info({ 
      assembly_id: validated.dsl.meta.assembly_id,
      template: validated.templatePackId,
      format: validated.format,
      duration 
    }, 'Render completed');

    // Build response
    const response: RenderResponse = {
      svg,
      manifest: {
        rendererVersion: version,
        templatePackId: validated.templatePackId,
        rendererKind: 'svg2d',
        schemaHash: validated.dsl.meta.schema_hash,
      },
    };

    // TODO: Convert to PDF/PNG if requested
    if (validated.format === 'pdf') {
      fastify.log.warn('PDF conversion not yet implemented, returning SVG');
    } else if (validated.format === 'png') {
      fastify.log.warn('PNG conversion not yet implemented, returning SVG');
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400);
      return {
        error: 'Validation error',
        details: error.errors,
      };
    }

    fastify.log.error(error, 'Render error');
    reply.code(500);
    return {
      error: 'Render failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`🎨 Renderer service listening on ${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

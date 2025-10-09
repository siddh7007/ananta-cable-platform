import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AssembliesDAO } from '../dao/assemblies.js';
import { assemblyToRenderDSL, type RenderDSL } from '../lib/assembly-to-dsl.js';
import { createHash } from 'crypto';
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import type { AssemblySchema } from '@cable-platform/contracts/types/api';
import { ErrorCode } from '../../../../shared/libs/error-codes.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: { sub: string };
}

interface RenderRequest {
  assembly_id?: string;
  schema?: AssemblySchema; // Optional: provide schema directly
  templatePackId?: string;
  format?: 'svg' | 'pdf' | 'png';
  inline?: boolean; // Return SVG inline instead of URL
}

interface RenderResponse {
  render_manifest: {
    rendererVersion: string;
    templatePackId: string;
    rendererKind: 'svg2d';
    schemaHash: string;
    cacheHit?: boolean;
  };
  url?: string; // URL to the rendered file
  svg?: string; // Inline SVG (if inline=true && format=svg)
}

interface TemplatePackManifest {
  id: string;
  version: string;
  name: string;
  paper: string;
  dimensions: {
    width_mm: number;
    height_mm: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  styles: {
    lineWidth: number;
    fontSize: number;
    font: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

const assembliesDao = new AssembliesDAO();
const DRAWINGS_DIR = process.env.DRAWINGS_DIR || 'drawings';

function getRendererServiceURL(): string {
  return process.env.RENDERER_SERVICE_URL || 'http://localhost:5002';
}

/**
 * Check if DEV_AUTH_BYPASS is enabled
 */
function isDevAuthBypass(): boolean {
  return (process.env.DEV_AUTH_BYPASS ?? 'false') === 'true';
}

/**
 * Auth middleware - require authentication unless DEV_AUTH_BYPASS=true
 */
async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  const devBypass = isDevAuthBypass();

  if (!devBypass && !request.user?.sub) {
    reply.code(401).send({ error: ErrorCode.UNAUTHORIZED });
    return;
  }
}

/**
 * Calculate cache key from schema hash + template + renderer kind
 */
function calculateCacheKey(
  schemaHash: string,
  templatePackId: string,
  rendererKind: string,
): string {
  const data = `${schemaHash}:${templatePackId}:${rendererKind}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Get drawing file path
 */
function getDrawingPath(assemblyId: string, rev: string, format: string): string {
  return join(DRAWINGS_DIR, assemblyId, rev, `drawing.${format}`);
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load template pack manifests from packages/templates
 */
async function loadTemplatePackManifests(): Promise<TemplatePackManifest[]> {
  // For now, return hardcoded list (basic-a3)
  // TODO: Read from filesystem packages/templates/**/manifest.json
  return [
    {
      id: 'basic-a3',
      version: '1.0.0',
      name: 'Basic A3 Template',
      paper: 'A3',
      dimensions: { width_mm: 420, height_mm: 297 },
      margins: { top: 20, right: 20, bottom: 30, left: 20 },
      styles: {
        lineWidth: 0.35,
        fontSize: 3.5,
        font: 'DIN-Regular',
        colors: { primary: '#000000', secondary: '#666666', accent: '#FF0000' },
      },
    },
  ];
}

export async function renderRoutes(fastify: FastifyInstance) {
  console.log('Inside renderRoutes function');

  /**
   * POST /v1/render - Render an assembly drawing
   */
  fastify.post('/v1/render', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const body = request.body as RenderRequest;
      const {
        assembly_id,
        schema: providedSchema,
        templatePackId = 'basic-a3',
        format = 'svg',
        inline = false,
      } = body;

      // Validate request
      if (!assembly_id && !providedSchema) {
        return reply.code(400).send({ error: 'assembly_id or schema required' });
      }

      try {
        // Load assembly schema
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let assemblyRecord: any;
        let schema: AssemblySchema;

        if (providedSchema) {
          // Use provided schema
          schema = providedSchema;
        } else if (assembly_id) {
          // Load from database
          assemblyRecord = await assembliesDao.getAssemblySchema(assembly_id);

          if (!assemblyRecord) {
            return reply.code(404).send({ error: 'Assembly not found' });
          }

          schema = assemblyRecord.schema as AssemblySchema;
        } else {
          return reply.code(400).send({ error: 'assembly_id or schema required' });
        }

        // Validate template pack exists
        const templates = await loadTemplatePackManifests();
        const template = templates.find((t) => t.id === templatePackId);
        if (!template) {
          return reply.code(400).send({ error: `Template pack '${templatePackId}' not found` });
        }

        // Calculate cache key
        const schemaHash =
          schema.schema_hash ||
          createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 16);
        const cacheKey = calculateCacheKey(schemaHash, templatePackId, 'svg2d');
        const rev = cacheKey.slice(0, 8); // Use first 8 chars as revision

        // Check if cached drawing exists
        const assemblyId = schema.assembly_id;
        const drawingPath = getDrawingPath(assemblyId, rev, format);

        if (await fileExists(drawingPath)) {
          // Cache hit! Return cached drawing
          fastify.log.info({ assemblyId, rev, format, cacheKey }, 'Cache hit for drawing');

          if (inline && format === 'svg') {
            const svgContent = await readFile(drawingPath, 'utf-8');
            return reply.send({
              render_manifest: {
                rendererVersion: '0.0.0',
                templatePackId,
                rendererKind: 'svg2d',
                schemaHash,
                cacheHit: true,
              },
              svg: svgContent,
            } as RenderResponse);
          }

          return reply.send({
            render_manifest: {
              rendererVersion: '0.0.0',
              templatePackId,
              rendererKind: 'svg2d',
              schemaHash,
              cacheHit: true,
            },
            url: `/drawings/${assemblyId}/${rev}/drawing.${format}`,
          } as RenderResponse);
        }

        // Cache miss - generate drawing
        fastify.log.info({ assemblyId, templatePackId, format }, 'Generating drawing');

        // Convert schema to RenderDSL
        const dsl: RenderDSL = assemblyToRenderDSL(schema, templatePackId);

        // Call renderer service
        const rendererURL = getRendererServiceURL();
        fastify.log.info({ rendererURL, assemblyId }, 'Calling renderer service');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let renderResult: any;
        let svgContent: string;

        // In test mode, return mock response directly
        if (process.env.TEST_MODE === 'true') {
          svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297">
  <metadata>
    <assembly id="${dsl.meta.assembly_id}" schema="${dsl.meta.schema_hash}"/>
    <template id="${templatePackId}" version="1.0.0"/>
  </metadata>
  <text x="210" y="150" text-anchor="middle">Test Assembly ${dsl.meta.assembly_id}</text>
</svg>`;
          renderResult = {
            svg: svgContent,
            manifest: {
              rendererVersion: '0.0.0',
              templatePackId,
              rendererKind: 'svg2d',
              schemaHash: dsl.meta.schema_hash,
            },
          };
        } else {
          const renderServiceResponse = await fetch(`${rendererURL}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dsl, templatePackId, format }),
          });

          if (!renderServiceResponse.ok) {
            const errorText = await renderServiceResponse.text();
            fastify.log.error(
              { status: renderServiceResponse.status, error: errorText },
              'Renderer service error',
            );
            return reply.code(500).send({ error: 'Renderer service failed', details: errorText });
          }

          renderResult = await renderServiceResponse.json();
          svgContent = renderResult.svg;

          if (!svgContent) {
            return reply.code(500).send({ error: 'Renderer returned no SVG' });
          }
        }

        // Persist to filesystem
        const drawingDir = join(DRAWINGS_DIR, assemblyId, rev);
        await mkdir(drawingDir, { recursive: true });
        await writeFile(drawingPath, svgContent, 'utf-8');

        fastify.log.info({ path: drawingPath }, 'Drawing persisted');

        // Return response
        if (inline && format === 'svg') {
          return reply.send({
            render_manifest: {
              rendererVersion: renderResult.manifest?.rendererVersion || '0.0.0',
              templatePackId,
              rendererKind: 'svg2d',
              schemaHash,
              cacheHit: false,
            },
            svg: svgContent,
          } as RenderResponse);
        }

        return reply.send({
          render_manifest: {
            rendererVersion: renderResult.manifest?.rendererVersion || '0.0.0',
            templatePackId,
            rendererKind: 'svg2d',
            schemaHash,
            cacheHit: false,
          },
          url: `/drawings/${assemblyId}/${rev}/drawing.${format}`,
        } as RenderResponse);
      } catch (error) {
        fastify.log.error(error, 'Render error');
        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  });

  /**
   * GET /v1/template-packs - List available template packs
   */
  fastify.get('/v1/template-packs', {
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const templates = await loadTemplatePackManifests();
        return reply.send({ templates });
      } catch (error) {
        fastify.log.error(error, 'Error loading template packs');
        return reply.code(500).send({ error: 'Failed to load template packs' });
      }
    },
  });
}

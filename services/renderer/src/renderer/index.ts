import { RenderDSL, RenderContext, TemplatePackManifest } from '../types.js';
import { loadTemplatePack } from './template-loader.js';
import { topologyPass } from './passes/topology.js';
import { routingPass } from './passes/routing.js';
import { collisionPass } from './passes/collision.js';
import { dimensionPass } from './passes/dimension.js';
import { generateSVG } from './svg-generator.js';

/**
 * Main render pipeline: transforms RenderDSL into deterministic SVG
 */
export async function renderToSVG(
  dsl: RenderDSL,
  templatePackId: string
): Promise<string> {
  // Load template pack
  const template = await loadTemplatePack(templatePackId);

  // Initialize render context
  const ctx = initializeContext(dsl, template);

  // Run pipeline passes
  ctx.topology = topologyPass(ctx);
  ctx.routing = routingPass(ctx);
  ctx.collisions = collisionPass(ctx);
  ctx.dimensions = dimensionPass(ctx);

  // Generate deterministic SVG
  const svg = generateSVG(ctx);

  return svg;
}

function initializeContext(
  dsl: RenderDSL,
  template: TemplatePackManifest
): RenderContext {
  const { width_mm, height_mm } = template.dimensions;
  const { top, right, bottom, left } = template.margins;

  return {
    dsl,
    template,
    viewport: {
      width: width_mm,
      height: height_mm,
      contentX: left,
      contentY: top,
      contentWidth: width_mm - left - right,
      contentHeight: height_mm - top - bottom,
    },
    topology: {
      endA: { x: 0, y: 0, width: 0, height: 0 },
      endB: { x: 0, y: 0, width: 0, height: 0 },
      cableRegion: { x: 0, y: 0, width: 0, height: 0 },
    },
    routing: {
      paths: [],
    },
    collisions: {
      adjustedLabels: [],
    },
    dimensions: {
      oal: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        value_mm: 0,
        tolerance_mm: 0,
        broken: false,
      },
    },
  };
}

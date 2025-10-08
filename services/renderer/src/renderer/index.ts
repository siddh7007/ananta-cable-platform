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
  // Handle both old and new dimension formats
  const width_mm = template.dimensions.width_mm || template.dimensions.width || 420;
  const height_mm = template.dimensions.height_mm || template.dimensions.height || 297;
  const { top, right, bottom, left } = template.margins;

  // Provide default styles if not present
  const defaultStyles = {
    lineWidth: template.strokes?.medium || 0.6,
    fontSize: 10,
    font: template.fonts?.[0] || 'Inter',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#0066cc',
    },
  };

  const styles = template.styles || defaultStyles;

  return {
    dsl,
    template: {
      ...template,
      styles,
      dimensions: {
        ...template.dimensions,
        width_mm,
        height_mm,
      },
    },
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

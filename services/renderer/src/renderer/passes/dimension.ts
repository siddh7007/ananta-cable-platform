import { RenderContext, DimensionResult } from '../../types.js';

/**
 * Dimension Pass: Calculate overall length and tolerance annotations
 */
export function dimensionPass(ctx: RenderContext): DimensionResult {
  const { dsl, topology } = ctx;
  const { endA, endB, cableRegion } = topology;

  // Calculate OAL dimension line position (below cable)
  const y = cableRegion.y + cableRegion.height + 15;
  const x1 = endA.x;
  const x2 = endB.x + endB.width;

  return {
    oal: {
      x1: normalize(x1),
      y1: normalize(y),
      x2: normalize(x2),
      y2: normalize(y),
      value_mm: dsl.dimensions.oal_mm,
      tolerance_mm: dsl.dimensions.tolerance_mm,
      broken: dsl.dimensions.broken_dim || false,
    },
  };
}

function normalize(value: number, precision = 2): number {
  return parseFloat(value.toFixed(precision));
}

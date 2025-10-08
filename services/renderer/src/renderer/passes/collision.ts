import { RenderContext, CollisionResult } from '../../types.js';

/**
 * Collision Pass: Detect and resolve label overlaps
 */
export function collisionPass(ctx: RenderContext): CollisionResult {
  const { dsl, topology } = ctx;

  const adjustedLabels = dsl.labels.map((label) => {
    let x = 0;
    let y = 0;

    // Position based on anchor
    switch (label.anchor) {
      case 'endA':
        x = topology.endA.x + (label.offset_x || 0);
        y = topology.endA.y - 5 + (label.offset_y || 0);
        break;
      case 'endB':
        x = topology.endB.x + (label.offset_x || 0);
        y = topology.endB.y - 5 + (label.offset_y || 0);
        break;
      case 'cable':
        x = topology.cableRegion.x + topology.cableRegion.width / 2 + (label.offset_x || 0);
        y = topology.cableRegion.y - 10 + (label.offset_y || 0);
        break;
      case 'dimension':
        x = topology.cableRegion.x + topology.cableRegion.width / 2 + (label.offset_x || 0);
        y = topology.cableRegion.y + topology.cableRegion.height + 20 + (label.offset_y || 0);
        break;
    }

    return {
      original: label,
      x: normalize(x),
      y: normalize(y),
    };
  });

  // TODO: Implement actual collision detection and nudging
  // For now, just return positioned labels

  return { adjustedLabels };
}

function normalize(value: number, precision = 2): number {
  return parseFloat(value.toFixed(precision));
}

import { RenderContext, TopologyResult } from '../../types.js';

/**
 * Topology Pass: Place endpoints and calculate grid dimensions
 */
export function topologyPass(ctx: RenderContext): TopologyResult {
  const { dsl, viewport } = ctx;
  const { contentX, contentY, contentWidth, contentHeight } = viewport;

  // Connector dimensions (approximate)
  const connectorWidth = 20;
  const connectorHeight = 15;

  // Calculate positions for horizontal layout
  // EndA on left, EndB on right
  const spacing = 40; // Space from edges
  const cableLength = contentWidth - (2 * spacing) - (2 * connectorWidth);

  const endA = {
    x: contentX + spacing,
    y: contentY + contentHeight / 2 - connectorHeight / 2,
    width: connectorWidth,
    height: connectorHeight,
  };

  const endB = {
    x: contentX + contentWidth - spacing - connectorWidth,
    y: contentY + contentHeight / 2 - connectorHeight / 2,
    width: connectorWidth,
    height: connectorHeight,
  };

  const cableRegion = {
    x: endA.x + endA.width,
    y: contentY + contentHeight / 2 - 20,
    width: cableLength,
    height: 40,
  };

  return {
    endA,
    endB,
    cableRegion,
  };
}

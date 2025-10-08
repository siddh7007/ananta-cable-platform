import { RenderContext, RoutingResult, NetPath } from '../../types.js';

/**
 * Routing Pass: Assign lanes and calculate paths for nets
 */
export function routingPass(ctx: RenderContext): RoutingResult {
  const { dsl, topology } = ctx;
  const { endA, endB, cableRegion } = topology;

  const paths: NetPath[] = [];

  if (dsl.cable.type === 'ribbon') {
    // Ribbon cable: assign sequential lanes
    const { ways, pitch_in } = dsl.cable;
    const pitchMm = pitch_in * 25.4; // Convert inches to mm

    // Calculate ribbon layout
    const ribbonWidth = (ways - 1) * pitchMm;
    const startY = cableRegion.y + cableRegion.height / 2 - ribbonWidth / 2;

    dsl.nets.forEach((net, index) => {
      const lane = index % ways;
      const y = startY + lane * pitchMm;

      paths.push({
        circuit: net.circuit,
        lane,
        points: [
          { x: endA.x + endA.width, y },
          { x: endB.x, y },
        ],
        color: net.color,
      });
    });

    return {
      paths,
      ribbonLayout: {
        startX: endA.x + endA.width,
        startY,
        endX: endB.x,
        endY: startY,
        lanes: ways,
        pitch: pitchMm,
      },
    };
  } else {
    // Round cable: simple routing with vertical spacing
    const spacing = cableRegion.height / (dsl.nets.length + 1);

    dsl.nets.forEach((net, index) => {
      const y = cableRegion.y + spacing * (index + 1);

      paths.push({
        circuit: net.circuit,
        lane: index,
        points: [
          { x: endA.x + endA.width, y },
          { x: endB.x, y },
        ],
        color: net.color,
      });
    });

    return { paths };
  }
}

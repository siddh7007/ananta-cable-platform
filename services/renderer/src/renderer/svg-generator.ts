import { RenderContext } from '../types.js';

/**
 * Generate deterministic SVG from render context
 */
export function generateSVG(ctx: RenderContext): string {
  const { dsl, template, viewport, topology, routing, collisions, dimensions } = ctx;
  const assemblyId = dsl.meta.assembly_id;

  const elements: string[] = [];

  // Header with metadata
  elements.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  elements.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${viewport.width}mm" ` +
    `height="${viewport.height}mm" ` +
    `viewBox="0 0 ${viewport.width} ${viewport.height}">`
  );

  // Metadata
  elements.push(`  <metadata>`);
  elements.push(`    <assembly id="${assemblyId}" schema="${dsl.meta.schema_hash}"/>`);
  elements.push(`    <template id="${template.id}" version="${template.version}"/>`);
  elements.push(`  </metadata>`);

  // Defs for reusable elements
  elements.push(`  <defs>`);
  
  // Pin-1 triangle marker
  elements.push(`    <marker id="pin1-tri" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">`);
  elements.push(`      <path d="M 0,0 L 4,2 L 0,4 Z" fill="black"/>`);
  elements.push(`    </marker>`);
  
  // Red stripe pattern
  if (dsl.cable.type === 'ribbon' && dsl.cable.red_stripe) {
    elements.push(`    <pattern id="red-stripe" width="2" height="2" patternUnits="userSpaceOnUse">`);
    elements.push(`      <rect width="1" height="2" fill="red"/>`);
    elements.push(`    </pattern>`);
  }
  
  elements.push(`  </defs>`);

  // Styles
  elements.push(`  <style>`);
  elements.push(`    .connector { fill: none; stroke: black; stroke-width: ${template.styles.lineWidth}; }`);
  elements.push(`    .wire { fill: none; stroke-width: 0.25; }`);
  elements.push(`    .dimension { fill: none; stroke: black; stroke-width: 0.2; }`);
  elements.push(`    .text { font-family: ${template.styles.font}; font-size: ${template.styles.fontSize}px; fill: black; }`);
  elements.push(`    .label { font-size: ${template.styles.fontSize * 0.8}px; }`);
  elements.push(`  </style>`);

  // Draw connectors
  elements.push(`  <!-- Connectors -->`);
  elements.push(drawConnector(assemblyId, 'endA', topology.endA));
  elements.push(drawConnector(assemblyId, 'endB', topology.endB));

  // Draw pin-1 indicators
  elements.push(`  <!-- Pin-1 Indicators -->`);
  elements.push(drawPin1Indicator(assemblyId, 'L', topology.endA));
  elements.push(drawPin1Indicator(assemblyId, 'R', topology.endB));

  // Draw wires/nets
  elements.push(`  <!-- Wires -->`);
  routing.paths.forEach((path) => {
    elements.push(drawWire(assemblyId, path.circuit, path.points, path.color));
  });

  // Draw red stripe for ribbon
  if (dsl.cable.type === 'ribbon' && dsl.cable.red_stripe && routing.ribbonLayout) {
    elements.push(`  <!-- Red Stripe -->`);
    const { startX, startY, endX } = routing.ribbonLayout;
    elements.push(
      `  <rect id="${assemblyId}-red-stripe" ` +
      `x="${norm(startX)}" y="${norm(startY)}" ` +
      `width="${norm(endX - startX)}" height="1" ` +
      `fill="url(#red-stripe)"/>`
    );
  }

  // Draw dimensions
  elements.push(`  <!-- Dimensions -->`);
  const dim = dimensions.oal;
  elements.push(
    `  <g id="${assemblyId}-dim-oal" class="dimension">`
  );
  
  // Dimension line
  if (dim.broken) {
    // Broken dimension style
    const midX = (dim.x1 + dim.x2) / 2;
    const gap = 5;
    elements.push(
      `    <line x1="${norm(dim.x1)}" y1="${norm(dim.y1)}" ` +
      `x2="${norm(midX - gap)}" y2="${norm(dim.y2)}"/>`
    );
    elements.push(
      `    <line x1="${norm(midX + gap)}" y1="${norm(dim.y1)}" ` +
      `x2="${norm(dim.x2)}" y2="${norm(dim.y2)}"/>`
    );
    // Broken mark
    elements.push(
      `    <path d="M ${norm(midX - gap)},${norm(dim.y1 - 2)} ` +
      `L ${norm(midX)},${norm(dim.y1 + 2)} ` +
      `L ${norm(midX + gap)},${norm(dim.y1 - 2)}" ` +
      `fill="none" stroke="black" stroke-width="0.2"/>`
    );
  } else {
    // Normal dimension line
    elements.push(
      `    <line x1="${norm(dim.x1)}" y1="${norm(dim.y1)}" ` +
      `x2="${norm(dim.x2)}" y2="${norm(dim.y2)}"/>`
    );
  }
  
  // Extension lines
  elements.push(
    `    <line x1="${norm(dim.x1)}" y1="${norm(dim.y1 - 5)}" ` +
    `x2="${norm(dim.x1)}" y2="${norm(dim.y1 + 2)}"/>`
  );
  elements.push(
    `    <line x1="${norm(dim.x2)}" y1="${norm(dim.y2 - 5)}" ` +
    `x2="${norm(dim.x2)}" y2="${norm(dim.y2 + 2)}"/>`
  );
  
  // Dimension text
  const dimText = `${dim.value_mm} ±${dim.tolerance_mm} mm`;
  const textX = (dim.x1 + dim.x2) / 2;
  const textY = dim.y1 - 2;
  elements.push(
    `    <text x="${norm(textX)}" y="${norm(textY)}" ` +
    `class="text" text-anchor="middle">${dimText}</text>`
  );
  
  elements.push(`  </g>`);

  // Draw labels
  if (collisions.adjustedLabels.length > 0) {
    elements.push(`  <!-- Labels -->`);
    collisions.adjustedLabels.forEach((label, index) => {
      elements.push(
        `  <text id="${assemblyId}-label-${index}" ` +
        `x="${norm(label.x)}" y="${norm(label.y)}" ` +
        `class="text label">${escapeXml(label.original.text)}</text>`
      );
    });
  }

  // Notes pack reference
  if (dsl.notesPack) {
    elements.push(`  <!-- Notes -->`);
    elements.push(
      `  <text x="${norm(viewport.contentX)}" ` +
      `y="${norm(viewport.height - 10)}" ` +
      `class="text label">Notes: ${escapeXml(dsl.notesPack)}</text>`
    );
  }

  // QR code placeholder
  if (dsl.qr) {
    elements.push(`  <!-- QR Code -->`);
    const qrX = viewport.width - 30;
    const qrY = viewport.height - 30;
    elements.push(
      `  <rect id="${assemblyId}-qr" ` +
      `x="${norm(qrX)}" y="${norm(qrY)}" ` +
      `width="20" height="20" ` +
      `fill="white" stroke="black" stroke-width="0.2"/>`
    );
    elements.push(
      `  <text x="${norm(qrX + 10)}" y="${norm(qrY + 12)}" ` +
      `class="text label" text-anchor="middle" font-size="2">QR</text>`
    );
  }

  elements.push(`</svg>`);

  return elements.join('\n');
}

function drawConnector(assemblyId: string, end: string, bounds: { x: number; y: number; width: number; height: number }): string {
  return (
    `  <rect id="${assemblyId}-${end}" class="connector" ` +
    `x="${norm(bounds.x)}" y="${norm(bounds.y)}" ` +
    `width="${norm(bounds.width)}" height="${norm(bounds.height)}"/>`
  );
}

function drawPin1Indicator(assemblyId: string, side: string, bounds: { x: number; y: number; width: number; height: number }): string {
  const x = side === 'L' ? bounds.x - 3 : bounds.x + bounds.width + 3;
  const y = bounds.y + 2;
  return (
    `  <circle id="${assemblyId}-pin1-${side}" ` +
    `cx="${norm(x)}" cy="${norm(y)}" r="1" ` +
    `fill="black"/>`
  );
}

function drawWire(assemblyId: string, circuit: string, points: Array<{ x: number; y: number }>, color?: string): string {
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${norm(p.x)},${norm(p.y)}`)
    .join(' ');
  
  const strokeColor = color || 'black';
  
  return (
    `  <path id="${assemblyId}-net-${circuit}" class="wire" ` +
    `d="${pathData}" stroke="${strokeColor}"/>`
  );
}

function norm(value: number, precision = 2): string {
  return value.toFixed(precision);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

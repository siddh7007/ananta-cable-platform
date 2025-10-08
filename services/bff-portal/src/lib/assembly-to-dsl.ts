import type { AssemblySchema } from '@cable-platform/contracts/types/api';

/**
 * RenderDSL types (matching renderer service)
 */
export interface RenderDSL {
  meta: {
    assembly_id: string;
    schema_hash: string;
    created_at?: string;
  };
  dimensions: {
    oal_mm: number;
    tolerance_mm: number;
    broken_dim?: boolean;
  };
  cable: RibbonCable | RoundCable;
  endA: ConnectorFootprint;
  endB: ConnectorFootprint;
  nets: Net[];
  labels: Label[];
  notesPack: string;
  qr?: string;
}

export type RibbonCable = {
  type: 'ribbon';
  ways: number;
  pitch_in: number;
  red_stripe?: boolean;
};

export type RoundCable = {
  type: 'round';
  conductors: number;
  awg?: number;
  shield?: 'none' | 'foil' | 'braid' | 'foil_braid';
};

export interface ConnectorFootprint {
  connector_mpn: string;
  type: 'idc' | 'crimp' | 'solder' | 'ring_lug';
  positions: number;
  orientation?: 'horizontal' | 'vertical';
  pin_numbering?: 'sequential' | 'dual_row';
}

export interface Net {
  circuit: string;
  endA_pin: string;
  endB_pin: string;
  color?: string;
  shield?: 'none' | 'fold_back' | 'isolated' | 'pigtail';
}

export interface Label {
  text: string;
  anchor: 'endA' | 'endB' | 'cable' | 'dimension';
  offset_x?: number;
  offset_y?: number;
}

/**
 * Locale-specific color mappings for power cables
 */
const POWER_COLORS: Record<string, { positive: string; negative: string; ground: string }> = {
  NA: { positive: 'red', negative: 'black', ground: 'green' },
  EU: { positive: 'brown', negative: 'blue', ground: 'green-yellow' },
  JP: { positive: 'red', negative: 'white', ground: 'green' },
  Other: { positive: 'red', negative: 'black', ground: 'green' },
};

/**
 * Convert inches to millimeters
 */
function inchesToMm(inches: number): number {
  return inches * 25.4;
}

/**
 * Maps AssemblySchema (from synthesis/DRC) to RenderDSL for renderer service
 */
export function assemblyToRenderDSL(schema: AssemblySchema, _templatePackId: string): RenderDSL {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cable = schema.cable as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conductors = schema.conductors as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endpoints = schema.endpoints as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shield = schema.shield as any;
  const wirelist = schema.wirelist || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labels = schema.labels as any;

  // Determine cable type
  let cableDsl: RibbonCable | RoundCable;
  
  if (cable.type === 'ribbon' || (conductors.ribbon && conductors.ribbon.ways > 0)) {
    // Ribbon cable
    const ribbon = conductors.ribbon || {};
    cableDsl = {
      type: 'ribbon',
      ways: ribbon.ways || conductors.count || wirelist.length,
      pitch_in: ribbon.pitch_in || 0.05, // Default 50mil pitch
      red_stripe: ribbon.red_stripe !== false, // Default true
    };
  } else {
    // Round cable (power, sensor, coax, etc.)
    cableDsl = {
      type: 'round',
      conductors: conductors.count || wirelist.length,
      awg: conductors.awg,
      shield: shield.type || 'none',
    };
  }

  // Extract endpoints
  const endA = endpoints.endA || {};
  const endB = endpoints.endB || {};

  const endADsl: ConnectorFootprint = {
    connector_mpn: endA.connector?.mpn || 'UNKNOWN',
    type: endA.termination || 'crimp',
    positions: endA.connector?.positions || conductors.count || wirelist.length,
    orientation: 'horizontal',
  };

  const endBDsl: ConnectorFootprint = {
    connector_mpn: endB.connector?.mpn || 'UNKNOWN',
    type: endB.termination || 'crimp',
    positions: endB.connector?.positions || conductors.count || wirelist.length,
    orientation: 'horizontal',
  };

  // Build nets from wirelist
  const nets: Net[] = wirelist.map((row: unknown, index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wireRow = row as any;
    let color = wireRow.color;

    // For power cables without explicit colors, apply locale mapping
    if (!color && cable.type === 'power_cable') {
      const locale = (cable.locale || 'NA') as keyof typeof POWER_COLORS;
      const colorMap = POWER_COLORS[locale] || POWER_COLORS.NA;
      
      // Map circuit names to colors
      const circuit = (wireRow.circuit || '').toLowerCase();
      if (circuit.includes('+') || circuit.includes('pos') || circuit.includes('vcc')) {
        color = colorMap.positive;
      } else if (circuit.includes('gnd') || circuit.includes('ground') || circuit === 'pe') {
        color = colorMap.ground;
      } else if (circuit.includes('-') || circuit.includes('neg') || circuit.includes('return')) {
        color = colorMap.negative;
      } else {
        // Default color for ribbon cables
        const defaultColors = ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'black'];
        color = defaultColors[index % defaultColors.length];
      }
    }

    return {
      circuit: wireRow.circuit || `Net${index + 1}`,
      endA_pin: wireRow.endA_pin || String(index + 1),
      endB_pin: wireRow.endB_pin || String(index + 1),
      color,
      shield: wireRow.shield || 'none',
    };
  });

  // Extract labels from schema
  const labelsDsl: Label[] = [];
  
  if (labels && Array.isArray(labels.callouts)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labels.callouts.forEach((label: any) => {
      // Convert inch offsets to mm
      const offset_x = label.offset_x ? inchesToMm(label.offset_x) : 0;
      const offset_y = label.offset_y ? inchesToMm(label.offset_y) : 0;

      labelsDsl.push({
        text: label.text,
        anchor: label.anchor || 'cable',
        offset_x,
        offset_y,
      });
    });
  }

  // Add endpoint labels if provided
  if (endA.label) {
    labelsDsl.push({
      text: endA.label,
      anchor: 'endA',
      offset_y: -5, // 5mm above
    });
  }

  if (endB.label) {
    labelsDsl.push({
      text: endB.label,
      anchor: 'endB',
      offset_y: -5,
    });
  }

  // Extract dimensions
  const length_mm = cable.length_mm || 1000;
  const tolerance_mm = cable.tolerance_mm || 5;

  // Check if cable is too long for single drawing (broken dimension)
  const broken_dim = length_mm > 2000; // Over 2 meters, use broken dimension

  // Extract notes pack
  const notesPack = cable.notes_pack_id || labels?.notes_pack || 'STANDARD';

  // Build QR code URL (hash of assembly)
  const qr = `https://cable.example.com/a/${schema.assembly_id}`;

  return {
    meta: {
      assembly_id: schema.assembly_id,
      schema_hash: schema.schema_hash,
      created_at: new Date().toISOString(),
    },
    dimensions: {
      oal_mm: length_mm,
      tolerance_mm,
      broken_dim,
    },
    cable: cableDsl,
    endA: endADsl,
    endB: endBDsl,
    nets,
    labels: labelsDsl,
    notesPack,
    qr,
  };
}

/**
 * RenderDSL - Minimal drawing specification language for cable assemblies
 */

export interface RenderDSL {
  /** Assembly metadata */
  meta: {
    assembly_id: string;
    schema_hash: string;
    created_at?: string;
  };

  /** Physical dimensions */
  dimensions: {
    oal_mm: number;
    tolerance_mm: number;
    broken_dim?: boolean; // Use broken dimension style
  };

  /** Cable/ribbon specification */
  cable: RibbonCable | RoundCable;

  /** End A connector */
  endA: ConnectorFootprint;

  /** End B connector */
  endB: ConnectorFootprint;

  /** Wire nets */
  nets: Net[];

  /** Label/callout placements */
  labels: Label[];

  /** Notes pack ID */
  notesPack: string;

  /** QR code URL */
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
 * Render request payload
 */
export interface RenderRequest {
  dsl: RenderDSL;
  templatePackId: string;
  format?: 'svg' | 'pdf' | 'png';
}

/**
 * Render response
 */
export interface RenderResponse {
  svg?: string;
  pdf?: string; // base64
  png?: string; // base64
  manifest: RenderManifest;
}

export interface RenderManifest {
  rendererVersion: string;
  templatePackId: string;
  rendererKind: 'svg2d';
  schemaHash: string;
}

/**
 * Template pack manifest
 */
export interface TemplatePackManifest {
  id: string;
  version: string;
  name: string;
  paper: 'A3' | 'Letter' | 'A4';
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

/**
 * Internal rendering context
 */
export interface RenderContext {
  dsl: RenderDSL;
  template: TemplatePackManifest;
  viewport: {
    width: number;
    height: number;
    contentX: number;
    contentY: number;
    contentWidth: number;
    contentHeight: number;
  };
  topology: TopologyResult;
  routing: RoutingResult;
  collisions: CollisionResult;
  dimensions: DimensionResult;
}

export interface TopologyResult {
  endA: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  endB: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cableRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RoutingResult {
  paths: NetPath[];
  ribbonLayout?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    lanes: number;
    pitch: number;
  };
}

export interface NetPath {
  circuit: string;
  lane: number;
  points: { x: number; y: number }[];
  color?: string;
}

export interface CollisionResult {
  adjustedLabels: Array<{
    original: Label;
    x: number;
    y: number;
  }>;
}

export interface DimensionResult {
  oal: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    value_mm: number;
    tolerance_mm: number;
    broken: boolean;
  };
}

/**
 * SVG generation options
 */
export interface SVGOptions {
  precision?: number; // Decimal places (default: 2)
  prettyPrint?: boolean;
  includeMetadata?: boolean;
}

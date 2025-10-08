// Types for the portal app
export interface PartRef {
  mpn: string;
  family: string;
  series: string;
  notes?: string;
}

export interface WirelistRow {
  wire_id: string;
  from: string;
  to: string;
  color?: string;
  awg?: number;
  length_m?: number;
}

export interface BomLine {
  part_ref: PartRef;
  qty: number;
  role: 'primary' | 'alternate';
  reason: string;
}

export interface SynthesisProposal {
  proposal_id: string;
  draft_id: string;
  cable: {
    primary: PartRef;
    alternates: PartRef[];
  };
  conductors: {
    count: number;
    awg?: number;
    color_map?: Record<string, string>;
  };
  endpoints: {
    endA: {
      connector: PartRef;
      termination: string;
      contacts?: {
        primary: PartRef;
        alternates: PartRef[];
      };
      accessories: PartRef[];
    };
    endB: {
      connector: PartRef;
      termination: string;
      contacts?: {
        primary: PartRef;
        alternates: PartRef[];
      };
      accessories: PartRef[];
    };
  };
  shield: {
    type: string;
    drain_policy: string;
  };
  wirelist: WirelistRow[];
  bom: BomLine[];
  warnings: string[];
  errors: string[];
  explain: string[];
}

export interface DrcResult {
  status: 'pass' | 'warning' | 'error';
  issues: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    location: string;
  }>;
  summary: string;
}

export type CableDesign = {
  id: string;
  name: string;
  cores: number;
};

export type DRCResult = {
  design_id: string;
  findings: Array<{
    code: string;
    message: string;
    severity: 'info' | 'warn' | 'error';
    path?: string;
  }>;
  severity_summary: {
    info?: number;
    warn?: number;
    error?: number;
  };
};
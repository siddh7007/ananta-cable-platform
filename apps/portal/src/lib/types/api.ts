// API types for the Cable Platform frontend
// These should eventually be generated from OpenAPI schemas

// DRC types (matching OpenAPI schemas from packages/contracts/openapi.yaml)
export type DrcSeverity = 'info' | 'warning' | 'error';
export type DrcStatus = 'pass' | 'warning' | 'error';
export type DrcDomain = 'mechanical' | 'electrical' | 'standards' | 'labeling' | 'consistency';
export type DrcFixEffect = 'non_destructive' | 'substitution' | 're_synthesis_required';

export interface DrcFinding {
  id: string;
  severity: DrcSeverity;
  domain: DrcDomain;
  code: string;
  message: string;
  where?: string;
  refs?: string[];
}

export interface DrcFix {
  id: string;
  label: string;
  description: string;
  applies_to: string[]; // Array of finding IDs
  effect: DrcFixEffect;
}

export interface DrcReport {
  assembly_id: string;
  ruleset_id: string;
  version: string;
  passed: boolean;
  errors: number;
  warnings: number;
  findings: DrcFinding[];
  fixes: DrcFix[];
  generated_at: string;
}

// Legacy/simplified types for backward compatibility
export interface DrcIssue {
  type: string;
  severity: DrcSeverity;
  message: string;
  location: string;
  suggestion?: string;
}

export interface DrcResult {
  status: DrcStatus;
  issues: DrcIssue[];
  summary: string;
}

// Legacy aliases for backward compatibility
export type DRCFinding = DrcIssue;
export type DRCReport = DrcResult;

// Connector types
export interface ConnectorSummary {
  mpn: string;
  manufacturer?: string;
  positions?: number;
  type?: string;
}

export interface ConnectorMetadata {
  mpn: string;
  manufacturer: string;
  series: string;
  positions: number;
  pitch_mm?: number;
  current_rating_a?: number;
  voltage_rating_v?: number;
}

export type TerminationType = 'crimp' | 'solder' | 'idc' | 'wire_to_board';

// Assembly types
export interface Endpoint {
  connector: ConnectorSummary;
  termination: TerminationType;
  label?: string;
}

export interface AssemblyStep1 {
  id: string;
  name: string;
  endpoints: Record<string, Endpoint>;
  conductor_count?: number;
  conductor_awg?: number;
}

export interface SynthesisProposal {
  assembly_id: string;
  cable_type: string;
  cable_length_mm: number;
  conductor_awg: number;
  conductor_count: number;
  shield_type?: string;
  endpoints: Record<string, Endpoint>;
}

// Region type
export interface Region {
  code: string;
  name: string;
  locale: string;
}
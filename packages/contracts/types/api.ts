// Generated types from OpenAPI specification
// These types correspond to the schemas defined in openapi.yaml

export type Region = 'NA' | 'EU' | 'JP' | 'Other';

export interface ConnectorSummary {
  mpn: string;
  family: string;
  series: string;
  positions: number;
  pitch_in: number;
  termination: TerminationType;
}

export interface ConnectorMetadata {
  mpn: string;
  family: string;
  series: string;
  positions: number;
  pitch_in: number;
  termination: TerminationType;
  gender: 'male' | 'female' | 'hermaphroditic';
  keying: string;
  compatible_contacts_awg: number[];
  backshell_strain_relief: boolean;
  pin1_semantics: string;
}

export type TerminationType = 'crimp' | 'idc' | 'ring_lug' | 'solder';

export interface AssemblyStep1 {
  type: 'ribbon' | 'power_cable' | 'sensor_lead' | 'rf_coax' | 'custom';
  length_mm: number;
  tolerance_mm: number;
  environment: { temp_min_c: number; temp_max_c: number; flex_class: 'static' | 'flex' | 'high_flex'; chemicals: string[] };
  electrical?: { system_voltage_v: number; per_circuit: { circuit: string; current_a: number; voltage_v: number }[] };
  emi: { shield: 'none' | 'foil' | 'braid' | 'foil_braid'; drain_policy: 'isolated' | 'fold_back' | 'pigtail' };
  locale: Region;
  compliance: { ipc_class: '1' | '2' | '3'; ul94_v0_labels: boolean; rohs_reach: boolean };
  endA: Endpoint;
  endB: Endpoint;
  constraints?: { stud_size: string; board_pitch_inch: number };
  must_use?: string[];
  notes_pack_id: string;
}

export interface Endpoint {
  selector: any;
  termination: TerminationType;
}

export interface AssemblyDraft {
  step: number;
  payload: AssemblyStep1;
  status: 'editing' | 'ready_for_step2';
}

export interface AssemblyDraftResponse {
  draft_id: string;
  status: string;
  updated_at: string;
}

export interface NotesPack {
  id: string;
  name: string;
  description: string;
}

export interface LocaleColors {
  colors: { L: string; N: string; PE: string };
  notes: string[];
}

export interface PartRef {
  mpn: string;
  family?: string;
  series?: string;
  notes?: string;
}

export interface WirelistRow {
  circuit: string;
  conductor: number;
  endA_pin?: string;
  endB_pin?: string;
  color?: string;
  shield?: 'none' | 'fold_back' | 'isolated' | 'pigtail';
}

export interface BomLine {
  ref: PartRef;
  qty: number;
  role: 'primary' | 'alternate';
  reason?: string;
}

export interface SynthesisProposal {
  proposal_id: string;
  draft_id: string;
  cable: { primary: PartRef; alternates: PartRef[] };
  conductors: { count: number; awg: number; color_map: string[]; ribbon: { pitch_in: number; ways: number; red_stripe: boolean } };
  endpoints: { endA: { connector: PartRef; termination: 'crimp' | 'idc' | 'ring_lug' | 'solder'; contacts: { primary: PartRef; alternates: PartRef[] }; accessories: PartRef[] }; endB: { connector: PartRef; termination: 'crimp' | 'idc' | 'ring_lug' | 'solder'; contacts: { primary: PartRef; alternates: PartRef[] }; accessories: PartRef[] } };
  shield: { type: 'none' | 'foil' | 'braid' | 'foil_braid'; drain_policy: 'isolated' | 'fold_back' | 'pigtail' };
  wirelist: WirelistRow[];
  bom: BomLine[];
  warnings: string[];
  errors: string[];
  explain: string[];
}

export interface DRCFinding {
  id: string;
  severity: 'error' | 'warning' | 'info';
  domain: 'mechanical' | 'electrical' | 'standards' | 'labeling' | 'consistency';
  code: string;
  message: string;
  where?: string;
  refs?: string[];
}

export interface DRCFix {
  id: string;
  label: string;
  description: string;
  applies_to: string[];
  effect: 'non_destructive' | 'substitution' | 're_synthesis_required';
}

export interface DRCReport {
  assembly_id: string;
  ruleset_id: string;
  version: string;
  passed: boolean;
  errors: number;
  warnings: number;
  findings: DRCFinding[];
  fixes: DRCFix[];
  generated_at: string;
}


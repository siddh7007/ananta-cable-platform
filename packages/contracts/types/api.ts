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

export interface DRCRuleset {
  id: string;
  version: string;
  created_at: string;
  notes?: string;
}

export interface DRCRulesetsResponse {
  rulesets: DRCRuleset[];
}

export interface DRCRunRequest {
  assembly_id: string;
  ruleset_id?: string;
  schema?: AssemblySchema;
}

export interface DRCApplyFixesRequest {
  assembly_id: string;
  fix_ids: string[];
  ruleset_id?: string;
  schema?: AssemblySchema;
}

export interface DRCApplyFixesResponse {
  assembly_id: string;
  schema_hash: string;
  schema: AssemblySchema;
  drc: DRCReport;
}

export interface AssemblySchema {
  assembly_id: string;
  schema_hash: string;
  cable: Record<string, any>;
  conductors: Record<string, any>;
  endpoints: Record<string, any>;
  shield: Record<string, any>;
  wirelist: Record<string, any>[];
  bom: Record<string, any>[];
  labels?: Record<string, any>;
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

export interface TemplatePack {
  id: string;
  version: string;
  name: string;
  paper: 'A3' | 'Letter';
  notes?: string;
}

export interface RenderRequest {
  assembly_id: string;
  template_pack_id: string;
  format?: 'svg' | 'pdf' | 'png';
  inline?: boolean;
  renderer_kind?: 'svg2d' | 'cad';
}

export interface RenderResponse {
  render_manifest: RenderManifest;
  url?: string;
  svg?: string;
}

export interface RenderManifest {
  rendererVersion: string;
  templatePackId: string;
  rendererKind: 'svg2d' | 'cad';
  schemaHash: string;
}

export interface Error {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Vendor quote interfaces for normalized vendor integration
 */

/**
 * Normalized vendor quote interface
 * Provides a common structure for quotes from different vendors
 */
export interface VendorQuote {
  /** Unique identifier for this quote */
  quoteId: string;

  /** Vendor providing the quote (e.g., 'mouser', 'digikey') */
  vendor: string;

  /** Part number from the vendor */
  vendorPartNumber: string;

  /** Manufacturer part number */
  manufacturerPartNumber?: string;

  /** Manufacturer name */
  manufacturer?: string;

  /** Description of the part */
  description?: string;

  /** Unit price in USD */
  unitPrice: number;

  /** Minimum order quantity */
  minimumOrderQuantity: number;

  /** Available quantity in stock */
  availableQuantity: number;

  /** Lead time in days */
  leadTimeDays?: number;

  /** Currency code (default: USD) */
  currency: string;

  /** Last updated timestamp */
  lastUpdated: string;

  /** Additional vendor-specific data */
  vendorData?: Record<string, unknown>;
}


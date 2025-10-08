from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field

# Basic types
Region = Literal["NA", "EU", "JP", "Other"]
TerminationType = Literal["crimp", "idc", "ring_lug", "solder"]

# Component reference
class PartRef(BaseModel):
    mpn: str
    family: Optional[str] = None
    series: Optional[str] = None
    notes: Optional[str] = None

# Wire specification
class WirelistRow(BaseModel):
    circuit: str
    conductor: int = Field(ge=1)
    endA_pin: Optional[str] = None
    endB_pin: Optional[str] = None
    color: Optional[str] = None
    shield: Optional[Literal["none", "fold_back", "isolated", "pigtail"]] = None

# Bill of materials
class BomLine(BaseModel):
    ref: PartRef
    qty: int = Field(ge=1)
    role: Literal["primary", "alternate"]
    reason: Optional[str] = None

# Environment specifications
class Environment(BaseModel):
    temp_min_c: float
    temp_max_c: float
    flex_class: Literal["static", "flex", "high_flex"]
    chemicals: Optional[List[str]] = None

# Electrical specifications
class Electrical(BaseModel):
    system_voltage_v: Optional[float] = None
    per_circuit: Optional[List[dict]] = None  # Simplified for now

# EMI specifications
class EMI(BaseModel):
    shield: Literal["none", "foil", "braid", "foil_braid"]
    drain_policy: Literal["isolated", "fold_back", "pigtail"]

# Compliance specifications
class Compliance(BaseModel):
    ipc_class: Optional[Literal["1", "2", "3"]] = None
    ul94_v0_labels: Optional[bool] = None
    rohs_reach: Optional[bool] = None

# Endpoint selector
class EndpointSelector(BaseModel):
    mpn: str

class EndpointSelectorSeries(BaseModel):
    series: str
    positions: int = Field(ge=1)

# Endpoint specification
class Endpoint(BaseModel):
    selector: Union[EndpointSelector, EndpointSelectorSeries]
    termination: TerminationType

# Step 1 assembly specification
class AssemblyStep1(BaseModel):
    type: Literal["ribbon", "power_cable", "sensor_lead", "rf_coax", "custom"]
    length_mm: int = Field(ge=1)
    tolerance_mm: int = Field(ge=0, le=100)
    environment: Environment
    electrical: Optional[Electrical] = None
    emi: EMI
    locale: Region
    compliance: Compliance
    endA: Endpoint
    endB: Endpoint
    constraints: Optional[dict] = None  # Simplified
    must_use: Optional[List[str]] = None
    notes_pack_id: str

# Conductor specifications
class ConductorSpec(BaseModel):
    count: Optional[int] = Field(None, ge=1)
    awg: Optional[int] = None
    color_map: Optional[List[str]] = None
    ribbon: Optional[dict] = None  # Simplified

# Endpoint with full specification
class EndpointFull(BaseModel):
    connector: PartRef
    termination: TerminationType
    contacts: Optional[dict] = None  # Simplified
    accessories: Optional[List[PartRef]] = None

# Shield specification
class ShieldSpec(BaseModel):
    type: Literal["none", "foil", "braid", "foil_braid"]
    drain_policy: Literal["isolated", "fold_back", "pigtail"]

# Synthesis proposal
class SynthesisProposal(BaseModel):
    proposal_id: str
    draft_id: str
    cable: dict  # Simplified: {primary: PartRef, alternates: List[PartRef]}
    conductors: ConductorSpec
    endpoints: dict  # Simplified: {endA: EndpointFull, endB: EndpointFull}
    shield: ShieldSpec
    wirelist: List[WirelistRow]
    bom: List[BomLine]
    warnings: List[str]
    errors: List[str]
    explain: List[str]

# DRC preview response
class DRCPreviewResponse(BaseModel):
    warnings: List[str]
    errors: List[str]

# DRC issue types and severities
DrcIssueType = Literal[
    "connector_pin_count",
    "contact_wire_compatibility",
    "termination_type",
    "electrical_rating",
    "shielding_requirement",
    "environmental_compatibility"
]

DrcSeverity = Literal["info", "warning", "error"]

# DRC issue
class DrcIssue(BaseModel):
    type: DrcIssueType
    severity: DrcSeverity
    message: str
    location: str
    suggestion: Optional[str] = None

# DRC result
class DrcResult(BaseModel):
    status: Literal["pass", "warning", "error"]
    issues: List[DrcIssue]
    summary: str
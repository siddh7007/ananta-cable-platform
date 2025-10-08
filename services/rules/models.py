from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# DRC Finding - matches OpenAPI DRCFinding schema
class DRCFinding(BaseModel):
    id: str
    severity: Literal["error", "warning", "info"]
    domain: Literal["mechanical", "electrical", "standards", "labeling", "consistency"]
    code: str
    message: str
    where: Optional[str] = None
    refs: Optional[List[str]] = None

# DRC Fix - matches OpenAPI DRCFix schema
class DRCFix(BaseModel):
    id: str
    label: str
    description: str
    applies_to: List[str]  # refs to schema paths
    effect: Literal["non_destructive", "substitution", "re_synthesis_required"]

# DRC Report - matches OpenAPI DRCReport schema
class DRCReport(BaseModel):
    assembly_id: str
    ruleset_id: str
    version: str
    passed: bool
    errors: int = Field(ge=0)
    warnings: int = Field(ge=0)
    findings: List[DRCFinding]
    fixes: List[DRCFix]
    generated_at: str  # ISO datetime string

# Ruleset - matches OpenAPI rulesets response
class Ruleset(BaseModel):
    id: str
    version: str
    created_at: str  # ISO datetime string
    notes: Optional[str] = None

# Rulesets response
class RulesetsResponse(BaseModel):
    rulesets: List[Ruleset]

# DRC Run request
class DRCRunRequest(BaseModel):
    assembly_id: str
    ruleset_id: Optional[str] = None

# DRC Apply Fixes request
class DRCApplyFixesRequest(BaseModel):
    assembly_id: str
    fix_ids: List[str]
    ruleset_id: Optional[str] = None

# DRC Apply Fixes response
class DRCApplyFixesResponse(BaseModel):
    assembly_id: str
    schema_hash: str
    drc: DRCReport

# Assembly Schema - for testing (direct input)
# This would be the full assembly schema from synthesis
class AssemblySchema(BaseModel):
    assembly_id: str
    schema_hash: str
    cable: dict
    conductors: dict
    endpoints: dict
    shield: dict
    wirelist: List[dict]
    bom: List[dict]
    labels: Optional[dict] = None
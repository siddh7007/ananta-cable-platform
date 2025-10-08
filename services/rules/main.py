from typing import Union

from fastapi import FastAPI, HTTPException

from drc_engine import DRCEngine
from models import (
    AssemblySchema,
    DRCApplyFixesRequest,
    DRCApplyFixesResponse,
    DRCReport,
    DRCRunRequest,
    RulesetsResponse,
)

app = FastAPI(title="DRC Rules Service", version="1.0.0")

drc_engine = DRCEngine()


@app.get("/health")
def health():
    return {"status": "ok", "service": "rules"}


@app.get("/drc/rulesets", response_model=RulesetsResponse)
def get_rulesets():
    """Return available rulesets."""
    try:
        rulesets = drc_engine.get_rulesets()
        return RulesetsResponse(rulesets=rulesets)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load DRC rulesets: {exc}") from exc


@app.post("/drc/run", response_model=DRCReport)
def run_drc(request: Union[DRCRunRequest, AssemblySchema]):
    """Run DRC on an assembly supplied directly or via cached assembly id."""
    try:
        if isinstance(request, AssemblySchema):
            assembly = request
            drc_engine.remember(assembly)
            ruleset_id = None
        else:
            assembly = request.schema or drc_engine.load(request.assembly_id)
            if assembly is None:
                raise HTTPException(status_code=404, detail="Assembly not found for DRC run.")
            if not isinstance(assembly, AssemblySchema):
                assembly = AssemblySchema.model_validate(assembly)
            drc_engine.remember(assembly)
            ruleset_id = request.ruleset_id

        return drc_engine.run_drc(assembly, ruleset_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"DRC run failed: {exc}") from exc


@app.post("/drc/apply-fixes", response_model=DRCApplyFixesResponse)
def apply_fixes(request: DRCApplyFixesRequest):
    """Apply selected fixes and return updated report."""
    assembly: AssemblySchema | None = request.schema or drc_engine.load(request.assembly_id)
    if assembly is None:
        raise HTTPException(status_code=404, detail="Assembly not found for applying fixes.")
    if not isinstance(assembly, AssemblySchema):
        assembly = AssemblySchema.model_validate(assembly)

    try:
        drc_engine.remember(assembly)
        updated_assembly, report = drc_engine.apply_fixes(assembly, request.fix_ids, request.ruleset_id)
        return DRCApplyFixesResponse(
            assembly_id=request.assembly_id,
            schema_hash=updated_assembly.schema_hash,
            schema=updated_assembly.model_dump(mode="json"),
            drc=report,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Apply fixes failed: {exc}") from exc

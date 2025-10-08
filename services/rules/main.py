from fastapi import FastAPI, HTTPException
from typing import Union
from models import (
    DRCReport, RulesetsResponse, DRCRunRequest, DRCApplyFixesRequest,
    DRCApplyFixesResponse, AssemblySchema
)
from drc_engine import DRCEngine

app = FastAPI(title="DRC Rules Service", version="1.0.0")

# Initialize DRC engine
drc_engine = DRCEngine()

@app.get("/health")
def health():
    return {"status": "ok", "service": "rules"}

@app.get("/drc/rulesets", response_model=RulesetsResponse)
def get_rulesets():
    """Get available DRC rulesets."""
    try:
        rulesets = drc_engine.get_rulesets()
        return RulesetsResponse(rulesets=rulesets)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rulesets: {str(e)}")

@app.post("/drc/run", response_model=DRCReport)
def run_drc(request: Union[DRCRunRequest, AssemblySchema]):
    """Run DRC on an assembly."""
    try:
        if isinstance(request, DRCRunRequest):
            # For now, create a mock assembly for testing
            # In production, this would fetch the assembly from a database
            assembly = AssemblySchema(
                assembly_id=request.assembly_id,
                schema_hash=f"hash_{request.assembly_id}",
                cable={"type": "ribbon", "length_mm": 500},
                conductors={"count": 12, "awg": 28, "ribbon": {"ways": 12, "red_stripe": True}},
                endpoints={
                    "endA": {"connector": {"mpn": "TEST-12", "positions": 12}, "termination": "idc"},
                    "endB": {"connector": {"mpn": "TEST-12", "positions": 12}, "termination": "idc"}
                },
                shield={"type": "none", "drain_policy": "isolated"},
                wirelist=[],
                bom=[],
                labels={"offset_mm": 30}
            )
        else:
            # Direct AssemblySchema input for testing
            assembly = request

        report = drc_engine.run_drc(assembly, getattr(request, 'ruleset_id', None))
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DRC run failed: {str(e)}")

@app.post("/drc/apply-fixes", response_model=DRCApplyFixesResponse)
def apply_fixes(request: DRCApplyFixesRequest):
    """Apply DRC fixes to an assembly."""
    try:
        # For now, create a mock assembly
        # In production, this would fetch the assembly from a database
        assembly = AssemblySchema(
            assembly_id=request.assembly_id,
            schema_hash=f"hash_{request.assembly_id}",
            cable={"type": "ribbon", "length_mm": 500},
            conductors={"count": 12, "awg": 28, "ribbon": {"ways": 12, "red_stripe": True}},
            endpoints={
                "endA": {"connector": {"mpn": "TEST-12", "positions": 12}, "termination": "idc"},
                "endB": {"connector": {"mpn": "TEST-12", "positions": 12}, "termination": "idc"}
            },
            shield={"type": "none", "drain_policy": "isolated"},
            wirelist=[],
            bom=[],
            labels={"offset_mm": 30}
        )

        schema_hash, drc_report = drc_engine.apply_fixes(
            assembly, request.fix_ids, request.ruleset_id
        )

        return DRCApplyFixesResponse(
            assembly_id=request.assembly_id,
            schema_hash=schema_hash,
            drc=drc_report
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Apply fixes failed: {str(e)}")
from fastapi import FastAPI, HTTPException
from typing import Optional
from models import AssemblyStep1, SynthesisProposal, DrcResult, RulesManifest, DrcRunRequest, DrcRunResponse
from synthesis import SynthesisEngine
from drc import DrcEngine

app = FastAPI(
    title="DRC Service",
    version="0.1.0",
    description="Design Rule Check service for cable platform validation",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Initialize engines
synthesis_engine = SynthesisEngine()
drc_engine = DrcEngine()

@app.get("/health")
def health():
    return {"status": "ok", "service": "drc"}

@app.post("/v1/synthesis/propose", response_model=SynthesisProposal)
def propose_synthesis(draft_id: str, step1_payload: AssemblyStep1):
    """Generate synthesis proposal from Step 1 assembly specification."""
    try:
        proposal = synthesis_engine.propose_synthesis(draft_id, step1_payload)
        return proposal
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Synthesis failed: {str(e)}")

@app.post("/v1/drc/preview", response_model=DrcResult)
def preview_drc(proposal: SynthesisProposal):
    """Validate synthesis proposal against design rules."""
    try:
        result = drc_engine.validate_proposal(proposal)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DRC validation failed: {str(e)}")

# Legacy endpoint for compatibility
@app.post("/v1/drc/run", response_model=DrcRunResponse)
def run_drc_legacy(design: DrcRunRequest):
    """Legacy DRC endpoint - returns empty findings for now."""
    return DrcRunResponse(
        design_id=design.id or "unknown",
        findings=[],
        severity_summary={"info": 0, "warn": 0, "error": 0}
    )

@app.get("/v1/drc/rules/manifest", response_model=RulesManifest)
def get_rules_manifest():
    """Get rules manifest with version, rules list, and IPC620 set metadata."""
    try:
        # Get manifest data from DRC engine
        manifest_data = drc_engine.get_rules_manifest()
        return manifest_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve rules manifest: {str(e)}")

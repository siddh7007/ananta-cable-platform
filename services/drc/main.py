from fastapi import FastAPI, HTTPException
from typing import Optional
from models import AssemblyStep1, SynthesisProposal, DrcResult
from synthesis import SynthesisEngine
from drc import DrcEngine

app = FastAPI(title="DRC Service", version="0.1.0")

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
@app.post("/v1/drc/run")
def run_drc_legacy(design: dict):
    """Legacy DRC endpoint - returns empty findings for now."""
    return {
        "design_id": design.get("id", "unknown"),
        "findings": [],
        "severity_summary": {"info": 0, "warn": 0, "error": 0}
    }

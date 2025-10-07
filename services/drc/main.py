from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="DRC Service", version="0.1.0")

class CableDesign(BaseModel):
    id: str
    name: str
    cores: int

@app.get("/health")
def health():
    return {"status": "ok", "service": "drc"}

@app.post("/v1/drc/run")
def run_drc(design: CableDesign):
    return {"design_id": design.id, "findings": [], "severity_summary": {"info":0,"warn":0,"error":0}}

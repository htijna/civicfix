from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import analyzer

app = FastAPI(title="CivicFix ML Microservice", version="1.0")

class ComplaintRequest(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "" # Optional fallback if provided by user
    location: Optional[dict] = None
    images: Optional[list] = []

class AnalysisResponse(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: str
    department: str
    severity: str
    priority: str
    confidence: float
    reason: str
    aiReport: Optional[str] = ""

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_complaint(request: ComplaintRequest):
    try:
        result = analyzer.analyze(
            request.title or "",
            request.description or "",
            request.images or [],
            request.location or {}
        )
        return AnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "CivicFix ML Microservice is running"}


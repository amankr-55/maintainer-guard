import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.models import PRAnalysisRequest, PRAnalysisResponse
from app.analyzer import analyze_pull_request

app = FastAPI(
    title="MaintainerGuard API",
    description="Autonomous Open-Source PR & Issue Triage Agent for Hacktoberfest 2026",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR / "test_samples"
STATIC_DIR = BASE_DIR / "static"

class SimulatedActionRequest(BaseModel):
    action: str  # "CLOSE_PR", "MERGE_PR", "LABEL", "COMMENT"
    pr_number: int
    repo_name: str
    comment: str = ""
    labels: list[str] = []

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "MaintainerGuard v1.0.0",
        "mode": "Autonomous Triage & Dry-Run Sandbox",
        "event": "Hacktoberfest 2026",
        "supported_models": ["local-ast-heuristics", "ollama:gemma3:1b", "open-weight-models"]
    }

@app.get("/api/samples")
async def get_demo_samples():
    """Returns pre-configured realistic PR scenarios for rapid live hackathon demos."""
    samples = []
    for file_path in SAMPLES_DIR.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                samples.append(data)
        except Exception as e:
            continue
    # sort predictably
    samples.sort(key=lambda s: s.get("id", ""))
    return samples

@app.post("/api/analyze", response_model=PRAnalysisResponse)
async def analyze_pr(req: PRAnalysisRequest):
    """Deep analysis of a pull request diff and metadata."""
    if not req.diff_content.strip():
        raise HTTPException(status_code=400, detail="Diff content cannot be empty.")
    
    result = await analyze_pull_request(req)
    return result

@app.post("/api/action/execute")
async def execute_github_action(req: SimulatedActionRequest):
    """Simulates or executes upstream GitHub webhook actions."""
    if req.action == "CLOSE_PR":
        return {
            "success": True,
            "message": f"Successfully closed PR #{req.pr_number} on {req.repo_name} with labels: {req.labels}",
            "badge": "CLOSED AS SPAM",
            "comment_posted": True
        }
    elif req.action == "MERGE_PR":
        return {
            "success": True,
            "message": f"Merged PR #{req.pr_number} cleanly into {req.repo_name}:main branch.",
            "badge": "MERGED",
            "comment_posted": True
        }
    else:
        return {
            "success": True,
            "message": f"Applied changes requested label to PR #{req.pr_number}.",
            "badge": "CHANGES REQUESTED",
            "comment_posted": True
        }

# Mount static folder
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
async def root():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "MaintainerGuard is running. Please access /static/index.html"}

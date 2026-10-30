from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PRAnalysisRequest(BaseModel):
    repo_name: str = Field(default="expressjs/express", description="Target repository")
    pr_number: Optional[int] = Field(default=4102, description="Pull Request number")
    pr_title: str = Field(..., description="Title of the PR")
    pr_author: str = Field(default="open-source-contributor", description="GitHub username")
    pr_description: str = Field(default="", description="PR description markdown")
    diff_content: str = Field(..., description="Unified git diff")
    run_sandbox: bool = Field(default=True, description="Whether to execute dry-run sandbox checks")

class SpamSignal(BaseModel):
    category: str
    severity: str  # "INFO", "WARNING", "CRITICAL"
    message: str
    code_snippet: Optional[str] = None

class BlastRadiusNode(BaseModel):
    id: str
    label: str
    type: str  # "file", "endpoint", "dependency", "test"
    status: str  # "modified", "impacted", "intact", "broken"

class BlastRadiusEdge(BaseModel):
    source: str
    target: str
    relationship: str

class BlastRadius(BaseModel):
    nodes: List[BlastRadiusNode]
    edges: List[BlastRadiusEdge]
    total_files_affected: int
    breaking_change_risk: str  # "LOW", "MEDIUM", "HIGH"

class SandboxResult(BaseModel):
    executed: bool
    status: str  # "PASSED", "FAILED", "WARNING"
    exit_code: int
    duration_ms: int
    logs: List[str]

class PRAnalysisResponse(BaseModel):
    pr_title: str
    pr_author: str
    verdict: str  # "ACCEPT", "FLAGGED_SPAM", "CRITICAL_HALLUCINATION", "NEEDS_CHANGES"
    spam_score: int  # 0 to 100
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    summary: str
    signals: List[SpamSignal]
    blast_radius: BlastRadius
    sandbox: SandboxResult
    suggested_github_action: str  # "MERGE", "CLOSE_AS_SPAM", "REQUEST_CHANGES", "CHALLENGE_AUTHOR"
    suggested_labels: List[str]
    suggested_comment: str
    proof_of_intent_challenge: Optional[str] = None
    time_saved_minutes: int = 35
    noise_reduction_ratio: str = "94%"

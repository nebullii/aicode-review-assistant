from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class VulnerabilityType(str, Enum):
    """SCRUM-97: Vulnerability Classification"""
    SQL_INJECTION = "sql_injection"
    XSS = "cross_site_scripting"
    AUTH_BYPASS = "authentication_bypass"
    INSECURE_DESERIALIZATION = "insecure_deserialization"
    SENSITIVE_DATA_EXPOSURE = "sensitive_data_exposure"
    XXE = "xml_external_entities"
    BROKEN_ACCESS_CONTROL = "broken_access_control"
    SECURITY_MISCONFIGURATION = "security_misconfiguration"
    INJECTION = "injection"
    INSECURE_DEPENDENCIES = "insecure_dependencies"
    UNKNOWN = "unknown"

class SeverityLevel(str, Enum):
    """SCRUM-99: Severity Scoring"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class Vulnerability(BaseModel):
    """Individual vulnerability finding"""
    type: VulnerabilityType
    severity: SeverityLevel
    line_number: int
    code_snippet: str
    description: str
    recommendation: str
    confidence: float = Field(ge=0.0, le=1.0)

class AnalysisRequest(BaseModel):
    """Request to analyze code"""
    code: str
    language: str = "javascript"
    repository: Optional[str] = None
    pr_number: Optional[int] = None
    file_path: Optional[str] = None

class AnalysisResult(BaseModel):
    """SCRUM-87: Analysis result with vulnerabilities"""
    analysis_id: str
    timestamp: datetime
    vulnerabilities: List[Vulnerability]
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    status: str
    language: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
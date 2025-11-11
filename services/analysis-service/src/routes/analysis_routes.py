from fastapi import APIRouter, HTTPException
from models.analysis_models import AnalysisRequest, AnalysisResult, Vulnerability
from services.vertex_ai_service import vertex_ai_service
from services.vulnerability_detector import vulnerability_detector
from config.database import get_database
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_code(request: AnalysisRequest):
    """
    SCRUM-87: Analyze code for security vulnerabilities
    
    This endpoint:
    1. Receives code to analyze
    2. Calls Vertex AI for vulnerability detection
    3. Classifies vulnerabilities (SCRUM-97)
    4. Scores severity (SCRUM-99)
    5. Stores results in MongoDB
    6. Returns analysis results
    """
    
    try:
        # Step 1: Call Vertex AI for analysis
        ai_response = await vertex_ai_service.analyze_code_for_vulnerabilities(
            code=request.code,
            language=request.language
        )
        
        # Step 2: Classify vulnerabilities (SCRUM-97)
        raw_vulns = ai_response.get("vulnerabilities", [])
        classified_vulns = vulnerability_detector.classify_vulnerabilities(raw_vulns)
        
        # Step 3: Count by severity (SCRUM-99)
        severity_counts = vulnerability_detector.count_by_severity(classified_vulns)
        
        # Step 4: Create analysis result
        analysis_id = str(uuid.uuid4())
        result = AnalysisResult(
            analysis_id=analysis_id,
            timestamp=datetime.utcnow(),
            vulnerabilities=classified_vulns,
            total_vulnerabilities=len(classified_vulns),
            critical_count=severity_counts["critical"],
            high_count=severity_counts["high"],
            medium_count=severity_counts["medium"],
            low_count=severity_counts["low"],
            status="completed",
            language=request.language
        )
        
        # Step 5: Store in MongoDB
        db = get_database()
        await db.analyses.insert_one({
            "analysis_id": analysis_id,
            "timestamp": datetime.utcnow(),
            "repository": request.repository,
            "pr_number": request.pr_number,
            "file_path": request.file_path,
            "language": request.language,
            "vulnerabilities": [v.dict() for v in classified_vulns],
            "severity_counts": severity_counts,
            "total_vulnerabilities": len(classified_vulns)
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/history")
async def get_analysis_history(limit: int = 10):
    """
    SCRUM-89: Get analysis history
    """
    db = get_database()

    cursor = db.analyses.find().sort("timestamp", -1).limit(limit)
    analyses = await cursor.to_list(length=limit)

    # Convert ObjectId to string
    for analysis in analyses:
        analysis["_id"] = str(analysis["_id"])

    return {"analyses": analyses, "total": len(analyses)}

@router.get("/pr/{repository}/{pr_number}")
async def get_pr_vulnerabilities(repository: str, pr_number: int):
    """
    Get all vulnerabilities for a specific PR across all analyzed files
    """
    db = get_database()

    # Find all analyses for this PR
    cursor = db.analyses.find({
        "repository": repository,
        "pr_number": pr_number
    }).sort("timestamp", -1)

    analyses = await cursor.to_list(length=None)

    if not analyses:
        return {
            "repository": repository,
            "pr_number": pr_number,
            "vulnerabilities": [],
            "total_vulnerabilities": 0,
            "severity_counts": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "files_analyzed": 0
        }

    # Aggregate all vulnerabilities
    all_vulnerabilities = []
    total_critical = 0
    total_high = 0
    total_medium = 0
    total_low = 0

    for analysis in analyses:
        if "vulnerabilities" in analysis:
            for vuln in analysis["vulnerabilities"]:
                vuln["file_path"] = analysis.get("file_path", "unknown")
                all_vulnerabilities.append(vuln)

        severity_counts = analysis.get("severity_counts", {})
        total_critical += severity_counts.get("critical", 0)
        total_high += severity_counts.get("high", 0)
        total_medium += severity_counts.get("medium", 0)
        total_low += severity_counts.get("low", 0)

    return {
        "repository": repository,
        "pr_number": pr_number,
        "vulnerabilities": all_vulnerabilities,
        "total_vulnerabilities": len(all_vulnerabilities),
        "severity_counts": {
            "critical": total_critical,
            "high": total_high,
            "medium": total_medium,
            "low": total_low
        },
        "files_analyzed": len(analyses),
        "analyses": [
            {
                "analysis_id": a.get("analysis_id"),
                "file_path": a.get("file_path"),
                "timestamp": a.get("timestamp"),
                "vulnerability_count": len(a.get("vulnerabilities", []))
            } for a in analyses
        ]
    }

@router.get("/health")
async def health_check():
    """Health check for analysis service"""
    return {
        "status": "ok",
        "service": "analysis-service",
        "features": ["SCRUM-87", "SCRUM-97", "SCRUM-99"]
    }
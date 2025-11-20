import grpc
from concurrent import futures
import sys
import os
import time
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from grpc_server.generated import analysis_pb2, analysis_pb2_grpc
from services.vertex_ai_service import vertex_ai_service
from services.vulnerability_detector import vulnerability_detector
from services.style_analyzer import style_analyzer
from config.database import get_database
import uuid
import asyncio


class AnalysisServicer(analysis_pb2_grpc.AnalysisServiceServicer):
    """gRPC service implementation for code analysis"""

    def __init__(self):
        """Initialize with a dedicated event loop for async operations"""
        self.loop = asyncio.new_event_loop()

    def AnalyzeCode(self, request, context):
        """Analyze code for vulnerabilities and style issues"""
        try:
            # Run async analysis in the shared event loop
            result = asyncio.run_coroutine_threadsafe(
                self._analyze_code_async(request),
                self.loop
            ).result()
            return result
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Analysis failed: {str(e)}")
            return analysis_pb2.AnalysisResponse()

    async def _analyze_code_async(self, request):
        """Async implementation of code analysis"""
        # Step 1: Security Analysis
        ai_response = await vertex_ai_service.analyze_code_for_vulnerabilities(
            code=request.code,
            language=request.language
        )

        raw_vulns = ai_response.get("vulnerabilities", [])
        classified_vulns = vulnerability_detector.classify_vulnerabilities(raw_vulns)
        severity_counts = vulnerability_detector.count_by_severity(classified_vulns)

        # Step 2: Style Analysis
        style_results = None
        total_style_issues = 0
        style_issues_list = []
        style_categories = {}

        if request.include_style_analysis and request.language == "python":
            style_results = style_analyzer.analyze_style(
                request.code,
                request.file_path or "temp.py"
            )
            total_style_issues = style_results.get("total_issues", 0)
            style_categories = style_results.get("categories", {})

            # Convert style issues to proto messages
            for issue in style_results.get("issues", []):
                style_issue = analysis_pb2.StyleIssue(
                    type=issue.get("type", "code_quality"),
                    category=issue["category"],
                    severity=issue["severity"],
                    line=issue["line"],
                    column=issue.get("column", 0),
                    code=issue["code"],
                    message=issue["message"],
                    recommendation=issue["recommendation"]
                )
                style_issues_list.append(style_issue)

        # Step 3: Convert vulnerabilities to proto messages
        vulnerabilities_list = []
        for vuln in classified_vulns:
            vulnerability = analysis_pb2.Vulnerability(
                type=vuln.type.value,
                severity=vuln.severity.value,
                line_number=vuln.line_number,
                code_snippet=vuln.code_snippet,
                description=vuln.description,
                recommendation=vuln.recommendation,
                confidence=vuln.confidence
            )
            vulnerabilities_list.append(vulnerability)

        # Step 4: Create response
        analysis_id = str(uuid.uuid4())

        # Store in MongoDB
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
            "total_vulnerabilities": len(classified_vulns),
            "style_issues": style_results.get("issues", []) if style_results else [],
            "style_categories": style_categories,
            "total_style_issues": total_style_issues,
        })

        return analysis_pb2.AnalysisResponse(
            analysis_id=analysis_id,
            timestamp=int(datetime.utcnow().timestamp()),
            total_vulnerabilities=len(classified_vulns),
            critical_count=severity_counts["critical"],
            high_count=severity_counts["high"],
            medium_count=severity_counts["medium"],
            low_count=severity_counts["low"],
            vulnerabilities=vulnerabilities_list,
            style_issues=style_issues_list,
            total_style_issues=total_style_issues,
            style_categories=style_categories,
            status="completed",
            language=request.language
        )

    def GetPRAnalysis(self, request, context):
        """Get analysis results for a specific PR"""
        try:
            result = asyncio.run_coroutine_threadsafe(
                self._get_pr_analysis_async(request),
                self.loop
            ).result()
            return result
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Failed to get PR analysis: {str(e)}")
            return analysis_pb2.PRAnalysisResponse()

    async def _get_pr_analysis_async(self, request):
        """Async implementation of get PR analysis"""
        db = get_database()

        cursor = db.analyses.find({
            "repository": request.repository,
            "pr_number": request.pr_number
        }).sort("timestamp", -1)

        analyses = await cursor.to_list(length=100)

        analyses_list = []
        for analysis in analyses:
            # Convert to proto message
            analysis_response = self._dict_to_analysis_response(analysis)
            analyses_list.append(analysis_response)

        return analysis_pb2.PRAnalysisResponse(
            analyses=analyses_list,
            total=len(analyses_list)
        )

    def GetAnalysisHistory(self, request, context):
        """Get recent analysis history"""
        try:
            result = asyncio.run_coroutine_threadsafe(
                self._get_analysis_history_async(request),
                self.loop
            ).result()
            return result
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Failed to get analysis history: {str(e)}")
            return analysis_pb2.HistoryResponse()

    async def _get_analysis_history_async(self, request):
        """Async implementation of get analysis history"""
        db = get_database()

        limit = request.limit if request.limit > 0 else 10
        cursor = db.analyses.find().sort("timestamp", -1).limit(limit)
        analyses = await cursor.to_list(length=limit)

        analyses_list = []
        for analysis in analyses:
            analysis_response = self._dict_to_analysis_response(analysis)
            analyses_list.append(analysis_response)

        return analysis_pb2.HistoryResponse(
            analyses=analyses_list,
            total=len(analyses_list)
        )

    def HealthCheck(self, request, context):
        """Health check endpoint"""
        return analysis_pb2.HealthResponse(
            status="healthy",
            version="1.0.0",
            timestamp=int(time.time())
        )

    def _dict_to_analysis_response(self, analysis_dict):
        """Convert MongoDB dict to proto AnalysisResponse"""
        # Convert vulnerabilities
        vulnerabilities_list = []
        for vuln in analysis_dict.get("vulnerabilities", []):
            vulnerability = analysis_pb2.Vulnerability(
                type=vuln.get("type", "unknown"),
                severity=vuln.get("severity", "info"),
                line_number=vuln.get("line_number", 0),
                code_snippet=vuln.get("code_snippet", ""),
                description=vuln.get("description", ""),
                recommendation=vuln.get("recommendation", ""),
                confidence=vuln.get("confidence", 0.0)
            )
            vulnerabilities_list.append(vulnerability)

        # Convert style issues
        style_issues_list = []
        for issue in analysis_dict.get("style_issues", []):
            style_issue = analysis_pb2.StyleIssue(
                type=issue.get("type", "code_quality"),
                category=issue.get("category", ""),
                severity=issue.get("severity", "info"),
                line=issue.get("line", 0),
                column=issue.get("column", 0),
                code=issue.get("code", ""),
                message=issue.get("message", ""),
                recommendation=issue.get("recommendation", "")
            )
            style_issues_list.append(style_issue)

        severity_counts = analysis_dict.get("severity_counts", {})
        style_categories = analysis_dict.get("style_categories", {})

        return analysis_pb2.AnalysisResponse(
            analysis_id=analysis_dict.get("analysis_id", ""),
            timestamp=int(analysis_dict.get("timestamp", datetime.utcnow()).timestamp()),
            total_vulnerabilities=analysis_dict.get("total_vulnerabilities", 0),
            critical_count=severity_counts.get("critical", 0),
            high_count=severity_counts.get("high", 0),
            medium_count=severity_counts.get("medium", 0),
            low_count=severity_counts.get("low", 0),
            vulnerabilities=vulnerabilities_list,
            style_issues=style_issues_list,
            total_style_issues=analysis_dict.get("total_style_issues", 0),
            style_categories=style_categories,
            status=analysis_dict.get("status", "completed"),
            language=analysis_dict.get("language", "python")
        )


def serve():
    """Start gRPC server"""
    import threading

    # Create servicer instance
    servicer = AnalysisServicer()

    # Start event loop in background thread
    def run_event_loop():
        asyncio.set_event_loop(servicer.loop)
        servicer.loop.run_forever()

    loop_thread = threading.Thread(target=run_event_loop, daemon=True)
    loop_thread.start()

    # Start gRPC server
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    analysis_pb2_grpc.add_AnalysisServiceServicer_to_server(servicer, server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("[gRPC] Analysis service started on port 50051")
    server.wait_for_termination()


if __name__ == '__main__':
    serve()

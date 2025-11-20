import grpc
from concurrent import futures
import time
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import generated proto files
from grpc_generated import analysis_pb2, analysis_pb2_grpc

# Import your analysis logic
# from analysis_engine import analyze_code_files


class AnalysisServicer(analysis_pb2_grpc.AnalysisServiceServicer):
    """Implementation of the Analysis Service"""

    def __init__(self):
        self.start_time = time.time()
        self.version = "1.0.0"
        print("✅ Analysis Service initialized")

    def AnalyzeCode(self, request, context):
        """Analyze code from a pull request"""
        try:
            print(f"📊 Analyzing PR: {request.pull_request_id}")
            print(f"   Repository: {request.repository_id}")
            print(f"   Files: {len(request.files)}")

            # Generate unique analysis ID
            import uuid
            analysis_id = str(uuid.uuid4())

            # TODO: Implement actual analysis logic
            # For now, return mock response
            issues = []

            # Example: Create a sample issue
            if len(request.files) > 0:
                sample_file = request.files[0]
                issue = analysis_pb2.Issue(
                    id=str(uuid.uuid4()),
                    type="best_practice",
                    severity="medium",
                    title="Consider code review",
                    description="This code could benefit from additional review",
                    file=sample_file.filename,
                    line_start=1,
                    line_end=10,
                    code_snippet=sample_file.content[:200] if sample_file.content else "",
                    suggestion="Review the implementation carefully",
                    references=["https://example.com/best-practices"]
                )
                issues.append(issue)

            summary = analysis_pb2.Summary(
                total_issues=len(issues),
                critical_issues=0,
                high_issues=0,
                medium_issues=len(issues),
                low_issues=0,
                files_analyzed=len(request.files),
                overall_quality="good"
            )

            metrics = analysis_pb2.Metrics(
                lines_analyzed=sum(f.lines_of_code for f in request.files),
                complexity_score=5,
                maintainability_index=75,
                processing_time_ms=100.0
            )

            result = analysis_pb2.AnalysisResult(
                issues=issues,
                summary=summary,
                metrics=metrics
            )

            response = analysis_pb2.AnalysisResponse(
                analysis_id=analysis_id,
                status="completed",
                result=result,
                error_message="",
                created_at=int(time.time()),
                completed_at=int(time.time())
            )

            print(f"✅ Analysis completed: {analysis_id}")
            return response

        except Exception as e:
            print(f"❌ Analysis error: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Analysis failed: {str(e)}")
            return analysis_pb2.AnalysisResponse(
                analysis_id="",
                status="failed",
                error_message=str(e)
            )

    def GetAnalysis(self, request, context):
        """Get analysis result by ID"""
        try:
            print(f"📋 Getting analysis: {request.analysis_id}")

            # TODO: Implement database lookup
            # For now, return not found
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Analysis not found")
            return analysis_pb2.AnalysisResponse(
                analysis_id=request.analysis_id,
                status="not_found"
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return analysis_pb2.AnalysisResponse()

    def BatchAnalyze(self, request, context):
        """Batch analyze multiple requests"""
        try:
            print(f"📦 Batch analyzing {len(request.requests)} requests")

            responses = []
            for req in request.requests:
                response = self.AnalyzeCode(req, context)
                responses.append(response)

            return analysis_pb2.BatchAnalysisResponse(responses=responses)

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return analysis_pb2.BatchAnalysisResponse()

    def HealthCheck(self, request, context):
        """Health check endpoint"""
        uptime = int(time.time() - self.start_time)
        return analysis_pb2.HealthCheckResponse(
            status="healthy",
            version=self.version,
            uptime_seconds=uptime
        )


def serve():
    """Start the gRPC server"""
    port = os.getenv('GRPC_PORT', '50052')

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    analysis_pb2_grpc.add_AnalysisServiceServicer_to_server(
        AnalysisServicer(), server
    )

    server.add_insecure_port(f'[::]:{port}')
    server.start()

    print(f"🚀 Analysis gRPC Server started on port {port}")
    print(f"   Listening on: 0.0.0.0:{port}")

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n👋 Shutting down Analysis gRPC Server...")
        server.stop(0)


if __name__ == '__main__':
    serve()

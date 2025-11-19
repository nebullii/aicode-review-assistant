const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load analysis proto
const ANALYSIS_PROTO_PATH = path.join(__dirname, '../../../../protos/analysis.proto');
const packageDefinition = protoLoader.loadSync(ANALYSIS_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const analysisProto = grpc.loadPackageDefinition(packageDefinition).codesentry.analysis;

// Create gRPC client
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_GRPC || 'analysis-service:50051';
const client = new analysisProto.AnalysisService(
  ANALYSIS_SERVICE_URL,
  grpc.credentials.createInsecure()
);

class AnalysisGrpcClient {
  /**
   * Analyze code using gRPC
   */
  async analyzeCode(code, filePath, prNumber, repository, includeStyle = true) {
    return new Promise((resolve, reject) => {
      console.log(`[gRPC] Analyzing file: ${filePath}`);

      client.AnalyzeCode(
        {
          code: code,
          language: 'python',
          file_path: filePath,
          pr_number: prNumber,
          repository: repository,
          include_style_analysis: includeStyle
        },
        {
          deadline: Date.now() + 30000 // 30 second timeout
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] Analysis failed for ${filePath}:`, error.message);
            reject(error);
            return;
          }

          console.log(`[gRPC] Analysis complete: ${response.total_vulnerabilities} vulnerabilities found`);

          // Convert to format compatible with existing code
          const result = {
            analysis_id: response.analysis_id,
            timestamp: response.timestamp,
            total_vulnerabilities: response.total_vulnerabilities,
            critical_count: response.critical_count,
            high_count: response.high_count,
            medium_count: response.medium_count,
            low_count: response.low_count,
            vulnerabilities: response.vulnerabilities || [],
            style_issues: response.style_issues || [],
            total_style_issues: response.total_style_issues || 0,
            style_categories: response.style_categories || {},
            status: response.status,
            language: response.language
          };

          resolve(result);
        }
      );
    });
  }

  /**
   * Get PR analysis results
   */
  async getPRAnalysis(prNumber, repository) {
    return new Promise((resolve, reject) => {
      client.GetPRAnalysis(
        {
          pr_number: prNumber,
          repository: repository
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] GetPRAnalysis failed:`, error.message);
            reject(error);
            return;
          }

          resolve({
            analyses: response.analyses || [],
            total: response.total || 0
          });
        }
      );
    });
  }

  /**
   * Get analysis history
   */
  async getAnalysisHistory(limit = 10) {
    return new Promise((resolve, reject) => {
      client.GetAnalysisHistory(
        {
          limit: limit
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] GetAnalysisHistory failed:`, error.message);
            reject(error);
            return;
          }

          resolve({
            analyses: response.analyses || [],
            total: response.total || 0
          });
        }
      );
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return new Promise((resolve, reject) => {
      client.HealthCheck(
        {},
        {
          deadline: Date.now() + 5000 // 5 second timeout
        },
        (error, response) => {
          if (error) {
            console.error('[gRPC] Analysis service health check failed:', error.message);
            resolve(null);
            return;
          }

          resolve({
            status: response.status,
            version: response.version,
            timestamp: response.timestamp
          });
        }
      );
    });
  }
}

module.exports = new AnalysisGrpcClient();

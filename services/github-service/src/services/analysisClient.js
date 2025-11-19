// Use gRPC for internal service communication
const analysisGrpcClient = require('../grpc/analysis-client');

// Export gRPC client with same interface
module.exports = analysisGrpcClient;
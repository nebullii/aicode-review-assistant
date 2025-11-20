// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var analysis_pb = require('./analysis_pb.js');

function serialize_analysis_AnalysisResponse(arg) {
  if (!(arg instanceof analysis_pb.AnalysisResponse)) {
    throw new Error('Expected argument of type analysis.AnalysisResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_AnalysisResponse(buffer_arg) {
  return analysis_pb.AnalysisResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_analysis_AnalyzeRequest(arg) {
  if (!(arg instanceof analysis_pb.AnalyzeRequest)) {
    throw new Error('Expected argument of type analysis.AnalyzeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_AnalyzeRequest(buffer_arg) {
  return analysis_pb.AnalyzeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_analysis_BatchAnalysisResponse(arg) {
  if (!(arg instanceof analysis_pb.BatchAnalysisResponse)) {
    throw new Error('Expected argument of type analysis.BatchAnalysisResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_BatchAnalysisResponse(buffer_arg) {
  return analysis_pb.BatchAnalysisResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_analysis_BatchAnalyzeRequest(arg) {
  if (!(arg instanceof analysis_pb.BatchAnalyzeRequest)) {
    throw new Error('Expected argument of type analysis.BatchAnalyzeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_BatchAnalyzeRequest(buffer_arg) {
  return analysis_pb.BatchAnalyzeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_analysis_GetAnalysisRequest(arg) {
  if (!(arg instanceof analysis_pb.GetAnalysisRequest)) {
    throw new Error('Expected argument of type analysis.GetAnalysisRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_GetAnalysisRequest(buffer_arg) {
  return analysis_pb.GetAnalysisRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_analysis_HealthCheckRequest(arg) {
  if (!(arg instanceof analysis_pb.HealthCheckRequest)) {
    throw new Error('Expected argument of type analysis.HealthCheckRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_HealthCheckRequest(buffer_arg) {
  return analysis_pb.HealthCheckRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_analysis_HealthCheckResponse(arg) {
  if (!(arg instanceof analysis_pb.HealthCheckResponse)) {
    throw new Error('Expected argument of type analysis.HealthCheckResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_analysis_HealthCheckResponse(buffer_arg) {
  return analysis_pb.HealthCheckResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// Analysis Service - Handles code analysis requests
var AnalysisServiceService = exports.AnalysisServiceService = {
  // Analyze code from a pull request
analyzeCode: {
    path: '/analysis.AnalysisService/AnalyzeCode',
    requestStream: false,
    responseStream: false,
    requestType: analysis_pb.AnalyzeRequest,
    responseType: analysis_pb.AnalysisResponse,
    requestSerialize: serialize_analysis_AnalyzeRequest,
    requestDeserialize: deserialize_analysis_AnalyzeRequest,
    responseSerialize: serialize_analysis_AnalysisResponse,
    responseDeserialize: deserialize_analysis_AnalysisResponse,
  },
  // Get analysis result by ID
getAnalysis: {
    path: '/analysis.AnalysisService/GetAnalysis',
    requestStream: false,
    responseStream: false,
    requestType: analysis_pb.GetAnalysisRequest,
    responseType: analysis_pb.AnalysisResponse,
    requestSerialize: serialize_analysis_GetAnalysisRequest,
    requestDeserialize: deserialize_analysis_GetAnalysisRequest,
    responseSerialize: serialize_analysis_AnalysisResponse,
    responseDeserialize: deserialize_analysis_AnalysisResponse,
  },
  // Batch analyze multiple files
batchAnalyze: {
    path: '/analysis.AnalysisService/BatchAnalyze',
    requestStream: false,
    responseStream: false,
    requestType: analysis_pb.BatchAnalyzeRequest,
    responseType: analysis_pb.BatchAnalysisResponse,
    requestSerialize: serialize_analysis_BatchAnalyzeRequest,
    requestDeserialize: deserialize_analysis_BatchAnalyzeRequest,
    responseSerialize: serialize_analysis_BatchAnalysisResponse,
    responseDeserialize: deserialize_analysis_BatchAnalysisResponse,
  },
  // Health check
healthCheck: {
    path: '/analysis.AnalysisService/HealthCheck',
    requestStream: false,
    responseStream: false,
    requestType: analysis_pb.HealthCheckRequest,
    responseType: analysis_pb.HealthCheckResponse,
    requestSerialize: serialize_analysis_HealthCheckRequest,
    requestDeserialize: deserialize_analysis_HealthCheckRequest,
    responseSerialize: serialize_analysis_HealthCheckResponse,
    responseDeserialize: deserialize_analysis_HealthCheckResponse,
  },
};

exports.AnalysisServiceClient = grpc.makeGenericClientConstructor(AnalysisServiceService, 'AnalysisService');

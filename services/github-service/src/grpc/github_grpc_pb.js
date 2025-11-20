// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var github_pb = require('./github_pb.js');

function serialize_github_CommentResponse(arg) {
  if (!(arg instanceof github_pb.CommentResponse)) {
    throw new Error('Expected argument of type github.CommentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_CommentResponse(buffer_arg) {
  return github_pb.CommentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_FilesResponse(arg) {
  if (!(arg instanceof github_pb.FilesResponse)) {
    throw new Error('Expected argument of type github.FilesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_FilesResponse(buffer_arg) {
  return github_pb.FilesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_GetFilesRequest(arg) {
  if (!(arg instanceof github_pb.GetFilesRequest)) {
    throw new Error('Expected argument of type github.GetFilesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_GetFilesRequest(buffer_arg) {
  return github_pb.GetFilesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_GetPRRequest(arg) {
  if (!(arg instanceof github_pb.GetPRRequest)) {
    throw new Error('Expected argument of type github.GetPRRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_GetPRRequest(buffer_arg) {
  return github_pb.GetPRRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_HealthCheckRequest(arg) {
  if (!(arg instanceof github_pb.HealthCheckRequest)) {
    throw new Error('Expected argument of type github.HealthCheckRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_HealthCheckRequest(buffer_arg) {
  return github_pb.HealthCheckRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_HealthCheckResponse(arg) {
  if (!(arg instanceof github_pb.HealthCheckResponse)) {
    throw new Error('Expected argument of type github.HealthCheckResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_HealthCheckResponse(buffer_arg) {
  return github_pb.HealthCheckResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_PostCommentRequest(arg) {
  if (!(arg instanceof github_pb.PostCommentRequest)) {
    throw new Error('Expected argument of type github.PostCommentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_PostCommentRequest(buffer_arg) {
  return github_pb.PostCommentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_PullRequestResponse(arg) {
  if (!(arg instanceof github_pb.PullRequestResponse)) {
    throw new Error('Expected argument of type github.PullRequestResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_PullRequestResponse(buffer_arg) {
  return github_pb.PullRequestResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_StatusResponse(arg) {
  if (!(arg instanceof github_pb.StatusResponse)) {
    throw new Error('Expected argument of type github.StatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_StatusResponse(buffer_arg) {
  return github_pb.StatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_UpdateStatusRequest(arg) {
  if (!(arg instanceof github_pb.UpdateStatusRequest)) {
    throw new Error('Expected argument of type github.UpdateStatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_UpdateStatusRequest(buffer_arg) {
  return github_pb.UpdateStatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_WebhookRequest(arg) {
  if (!(arg instanceof github_pb.WebhookRequest)) {
    throw new Error('Expected argument of type github.WebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_WebhookRequest(buffer_arg) {
  return github_pb.WebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_github_WebhookResponse(arg) {
  if (!(arg instanceof github_pb.WebhookResponse)) {
    throw new Error('Expected argument of type github.WebhookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_github_WebhookResponse(buffer_arg) {
  return github_pb.WebhookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// GitHub Service - Handles GitHub operations
var GitHubServiceService = exports.GitHubServiceService = {
  // Get pull request details
getPullRequest: {
    path: '/github.GitHubService/GetPullRequest',
    requestStream: false,
    responseStream: false,
    requestType: github_pb.GetPRRequest,
    responseType: github_pb.PullRequestResponse,
    requestSerialize: serialize_github_GetPRRequest,
    requestDeserialize: deserialize_github_GetPRRequest,
    responseSerialize: serialize_github_PullRequestResponse,
    responseDeserialize: deserialize_github_PullRequestResponse,
  },
  // Post analysis comment to PR
postComment: {
    path: '/github.GitHubService/PostComment',
    requestStream: false,
    responseStream: false,
    requestType: github_pb.PostCommentRequest,
    responseType: github_pb.CommentResponse,
    requestSerialize: serialize_github_PostCommentRequest,
    requestDeserialize: deserialize_github_PostCommentRequest,
    responseSerialize: serialize_github_CommentResponse,
    responseDeserialize: deserialize_github_CommentResponse,
  },
  // Update PR status check
updateStatus: {
    path: '/github.GitHubService/UpdateStatus',
    requestStream: false,
    responseStream: false,
    requestType: github_pb.UpdateStatusRequest,
    responseType: github_pb.StatusResponse,
    requestSerialize: serialize_github_UpdateStatusRequest,
    requestDeserialize: deserialize_github_UpdateStatusRequest,
    responseSerialize: serialize_github_StatusResponse,
    responseDeserialize: deserialize_github_StatusResponse,
  },
  // Get repository files
getRepositoryFiles: {
    path: '/github.GitHubService/GetRepositoryFiles',
    requestStream: false,
    responseStream: false,
    requestType: github_pb.GetFilesRequest,
    responseType: github_pb.FilesResponse,
    requestSerialize: serialize_github_GetFilesRequest,
    requestDeserialize: deserialize_github_GetFilesRequest,
    responseSerialize: serialize_github_FilesResponse,
    responseDeserialize: deserialize_github_FilesResponse,
  },
  // Process webhook event
processWebhook: {
    path: '/github.GitHubService/ProcessWebhook',
    requestStream: false,
    responseStream: false,
    requestType: github_pb.WebhookRequest,
    responseType: github_pb.WebhookResponse,
    requestSerialize: serialize_github_WebhookRequest,
    requestDeserialize: deserialize_github_WebhookRequest,
    responseSerialize: serialize_github_WebhookResponse,
    responseDeserialize: deserialize_github_WebhookResponse,
  },
  // Health check
healthCheck: {
    path: '/github.GitHubService/HealthCheck',
    requestStream: false,
    responseStream: false,
    requestType: github_pb.HealthCheckRequest,
    responseType: github_pb.HealthCheckResponse,
    requestSerialize: serialize_github_HealthCheckRequest,
    requestDeserialize: deserialize_github_HealthCheckRequest,
    responseSerialize: serialize_github_HealthCheckResponse,
    responseDeserialize: deserialize_github_HealthCheckResponse,
  },
};

exports.GitHubServiceClient = grpc.makeGenericClientConstructor(GitHubServiceService, 'GitHubService');

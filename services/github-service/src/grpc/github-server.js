const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const axios = require('axios');
const pool = require('../config/database');

// Load proto files
const GITHUB_PROTO_PATH = path.join(__dirname, '../../../../protos/github.proto');
const packageDefinition = protoLoader.loadSync(GITHUB_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const githubProto = grpc.loadPackageDefinition(packageDefinition).codesentry.github;

// Service implementation
const getPullRequest = async (call, callback) => {
  try {
    const { owner, repo, pr_number } = call.request;

    // Fetch PR from GitHub API
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}`
    );

    const pr = response.data;

    callback(null, {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      head_sha: pr.head.sha,
      base_branch: pr.base.ref,
      head_branch: pr.head.ref,
      author: pr.user.login,
      created_at: new Date(pr.created_at).getTime()
    });
  } catch (error) {
    console.error('[gRPC] GetPullRequest error:', error.message);
    callback({
      code: grpc.status.INTERNAL,
      details: `Failed to get pull request: ${error.message}`
    });
  }
};

const getPRFiles = async (call, callback) => {
  try {
    const { owner, repo, pr_number } = call.request;

    // Fetch PR files from GitHub API
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/files`
    );

    const files = response.data.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch || ''
    }));

    callback(null, { files });
  } catch (error) {
    console.error('[gRPC] GetPRFiles error:', error.message);
    callback({
      code: grpc.status.INTERNAL,
      details: `Failed to get PR files: ${error.message}`
    });
  }
};

const postComment = async (call, callback) => {
  try {
    const { owner, repo, pr_number, body, commit_id, path, line } = call.request;

    // Post comment to GitHub
    // Note: This requires GitHub token - implementation depends on your setup
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/comments`,
      {
        body,
        commit_id,
        path,
        line
      }
    );

    callback(null, {
      success: true,
      comment_id: response.data.id.toString(),
      message: 'Comment posted successfully'
    });
  } catch (error) {
    console.error('[gRPC] PostComment error:', error.message);
    callback(null, {
      success: false,
      comment_id: '',
      message: `Failed to post comment: ${error.message}`
    });
  }
};

const registerWebhook = async (call, callback) => {
  try {
    const { repository_full_name, github_token } = call.request;

    const [owner, repo] = repository_full_name.split('/');
    const webhookUrl = process.env.WEBHOOK_URL || 'http://github-service:3002/webhooks/github';

    // Register webhook with GitHub
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        name: 'web',
        active: true,
        events: ['pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '0'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    console.log(`[gRPC] Webhook registered for ${repository_full_name}: ${response.data.id}`);

    callback(null, {
      success: true,
      webhook_id: response.data.id.toString(),
      message: 'Webhook registered successfully'
    });
  } catch (error) {
    console.error('[gRPC] RegisterWebhook error:', error.message);
    callback(null, {
      success: false,
      webhook_id: '',
      message: `Failed to register webhook: ${error.message}`
    });
  }
};

const unregisterWebhook = async (call, callback) => {
  try {
    const { repository_full_name, webhook_id, github_token } = call.request;

    const [owner, repo] = repository_full_name.split('/');

    // Delete webhook from GitHub
    await axios.delete(
      `https://api.github.com/repos/${owner}/${repo}/hooks/${webhook_id}`,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    console.log(`[gRPC] Webhook ${webhook_id} unregistered for ${repository_full_name}`);

    callback(null, {
      success: true,
      message: 'Webhook unregistered successfully'
    });
  } catch (error) {
    console.error('[gRPC] UnregisterWebhook error:', error.message);
    callback(null, {
      success: false,
      message: `Failed to unregister webhook: ${error.message}`
    });
  }
};

const healthCheck = (call, callback) => {
  callback(null, {
    status: 'healthy',
    version: '1.0.0',
    timestamp: Date.now()
  });
};

// Start gRPC server
function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(githubProto.GitHubService.service, {
    GetPullRequest: getPullRequest,
    GetPRFiles: getPRFiles,
    PostComment: postComment,
    RegisterWebhook: registerWebhook,
    UnregisterWebhook: unregisterWebhook,
    HealthCheck: healthCheck
  });

  const port = process.env.GRPC_PORT || 50052;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[gRPC] Failed to start server:', err);
        return;
      }
      console.log(`[gRPC] GitHub service started on port ${port}`);
    }
  );

  return server;
}

module.exports = { startGrpcServer };

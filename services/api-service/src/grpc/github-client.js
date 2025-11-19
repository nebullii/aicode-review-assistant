const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load github proto
const GITHUB_PROTO_PATH = path.join(__dirname, '../../../../protos/github.proto');
const packageDefinition = protoLoader.loadSync(GITHUB_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const githubProto = grpc.loadPackageDefinition(packageDefinition).codesentry.github;

// Create gRPC client
const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_GRPC || 'github-service:50052';
const client = new githubProto.GitHubService(
  GITHUB_SERVICE_URL,
  grpc.credentials.createInsecure()
);

class GitHubGrpcClient {
  /**
   * Register webhook
   */
  async registerWebhook(repositoryFullName, githubToken) {
    return new Promise((resolve, reject) => {
      console.log(`[gRPC] Registering webhook for ${repositoryFullName}`);

      client.RegisterWebhook(
        {
          repository_full_name: repositoryFullName,
          github_token: githubToken
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] RegisterWebhook failed:`, error.message);
            reject(error);
            return;
          }

          if (!response.success) {
            console.error(`[gRPC] RegisterWebhook failed: ${response.message}`);
            reject(new Error(response.message));
            return;
          }

          console.log(`[gRPC] Webhook registered: ${response.webhook_id}`);
          resolve({
            webhook_id: response.webhook_id,
            message: response.message
          });
        }
      );
    });
  }

  /**
   * Unregister webhook
   */
  async unregisterWebhook(repositoryFullName, webhookId, githubToken) {
    return new Promise((resolve, reject) => {
      console.log(`[gRPC] Unregistering webhook ${webhookId} for ${repositoryFullName}`);

      client.UnregisterWebhook(
        {
          repository_full_name: repositoryFullName,
          webhook_id: webhookId,
          github_token: githubToken
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] UnregisterWebhook failed:`, error.message);
            reject(error);
            return;
          }

          if (!response.success) {
            console.error(`[gRPC] UnregisterWebhook failed: ${response.message}`);
            reject(new Error(response.message));
            return;
          }

          console.log(`[gRPC] Webhook unregistered successfully`);
          resolve({
            message: response.message
          });
        }
      );
    });
  }

  /**
   * Get pull request
   */
  async getPullRequest(owner, repo, prNumber) {
    return new Promise((resolve, reject) => {
      client.GetPullRequest(
        {
          owner: owner,
          repo: repo,
          pr_number: prNumber
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] GetPullRequest failed:`, error.message);
            reject(error);
            return;
          }

          resolve(response);
        }
      );
    });
  }

  /**
   * Get PR files
   */
  async getPRFiles(owner, repo, prNumber) {
    return new Promise((resolve, reject) => {
      client.GetPRFiles(
        {
          owner: owner,
          repo: repo,
          pr_number: prNumber
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] GetPRFiles failed:`, error.message);
            reject(error);
            return;
          }

          resolve(response);
        }
      );
    });
  }

  /**
   * Post comment
   */
  async postComment(owner, repo, prNumber, body, commitId, path, line) {
    return new Promise((resolve, reject) => {
      client.PostComment(
        {
          owner: owner,
          repo: repo,
          pr_number: prNumber,
          body: body,
          commit_id: commitId,
          path: path,
          line: line
        },
        (error, response) => {
          if (error) {
            console.error(`[gRPC] PostComment failed:`, error.message);
            reject(error);
            return;
          }

          resolve(response);
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
            console.error('[gRPC] GitHub service health check failed:', error.message);
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

module.exports = new GitHubGrpcClient();

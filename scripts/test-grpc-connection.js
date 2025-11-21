#!/usr/bin/env node

/**
 * Test gRPC connections between services
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Load proto files
const PROTO_PATH = path.join(__dirname, '../proto');

async function testAnalysisService() {
  const analysisProtoPath = path.join(PROTO_PATH, 'analysis.proto');
  const packageDefinition = protoLoader.loadSync(analysisProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);
  const serviceUrl = process.env.ANALYSIS_SERVICE_GRPC_URL || 'localhost:50052';

  log(colors.blue, `\n🔍 Testing Analysis Service at ${serviceUrl}...`);

  const client = new proto.analysis.AnalysisService(
    serviceUrl,
    grpc.credentials.createInsecure()
  );

  return new Promise((resolve) => {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);

    client.HealthCheck({}, { deadline }, (error, response) => {
      if (error) {
        log(colors.red, `✗ Analysis Service: ${error.message}`);
        resolve(false);
      } else {
        log(colors.green, `✓ Analysis Service: ${response.status}`);
        log(colors.blue, `  Version: ${response.version}`);
        log(colors.blue, `  Uptime: ${response.uptime_seconds}s`);
        resolve(true);
      }
    });
  });
}

async function testGitHubService() {
  const githubProtoPath = path.join(PROTO_PATH, 'github.proto');
  const packageDefinition = protoLoader.loadSync(githubProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);
  const serviceUrl = process.env.GITHUB_SERVICE_GRPC_URL || 'localhost:50051';

  log(colors.blue, `\n🔍 Testing GitHub Service at ${serviceUrl}...`);

  const client = new proto.github.GitHubService(
    serviceUrl,
    grpc.credentials.createInsecure()
  );

  return new Promise((resolve) => {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);

    client.HealthCheck({}, { deadline }, (error, response) => {
      if (error) {
        log(colors.red, `✗ GitHub Service: ${error.message}`);
        resolve(false);
      } else {
        log(colors.green, `✓ GitHub Service: ${response.status}`);
        log(colors.blue, `  Version: ${response.version}`);
        log(colors.blue, `  Uptime: ${response.uptime_seconds}s`);
        resolve(true);
      }
    });
  });
}

async function main() {
  log(colors.blue, '========================================');
  log(colors.blue, 'gRPC Connection Test');
  log(colors.blue, '========================================');

  const results = [];

  try {
    results.push(await testGitHubService());
  } catch (error) {
    log(colors.red, `Error testing GitHub Service: ${error.message}`);
    results.push(false);
  }

  try {
    results.push(await testAnalysisService());
  } catch (error) {
    log(colors.red, `Error testing Analysis Service: ${error.message}`);
    results.push(false);
  }

  // Summary
  log(colors.blue, '\n========================================');
  log(colors.blue, 'Summary');
  log(colors.blue, '========================================');

  const healthy = results.filter(r => r).length;
  const total = results.length;

  log(colors.blue, `Total Services: ${total}`);
  log(colors.green, `Healthy: ${healthy}`);
  log(colors.red, `Unhealthy: ${total - healthy}`);

  if (healthy === total) {
    log(colors.green, '\n✓ All gRPC services are healthy');
    process.exit(0);
  } else {
    log(colors.red, '\n✗ Some gRPC services are unhealthy');
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  log(colors.red, `Fatal error: ${error.message}`);
  process.exit(1);
});

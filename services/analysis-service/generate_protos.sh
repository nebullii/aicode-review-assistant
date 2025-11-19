#!/bin/bash

# Generate Python gRPC code from proto files
python -m grpc_tools.protoc \
  -I../../protos \
  --python_out=./src/grpc/generated \
  --grpc_python_out=./src/grpc/generated \
  ../../protos/analysis.proto \
  ../../protos/common.proto

echo "Proto files generated successfully!"

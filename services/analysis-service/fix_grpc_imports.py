#!/usr/bin/env python3
"""
Fix gRPC generated file imports to use relative imports
"""

import os
import re

def fix_imports(file_path):
    """Fix imports in generated gRPC files"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as f:
        content = f.read()

    # Replace absolute imports with relative imports
    patterns = [
        (r'^import analysis_pb2 as analysis__pb2$',
         'from grpc_server.generated import analysis_pb2 as analysis__pb2'),
        (r'^import common_pb2 as common__pb2$',
         'from grpc_server.generated import common_pb2 as common__pb2'),
    ]

    modified = False
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        if new_content != content:
            content = new_content
            modified = True

    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed imports in: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

if __name__ == '__main__':
    base_dir = '/app/src/grpc_server/generated'

    # Fix imports in generated files
    files_to_fix = [
        os.path.join(base_dir, 'analysis_pb2_grpc.py'),
        os.path.join(base_dir, 'common_pb2_grpc.py'),
    ]

    for file_path in files_to_fix:
        fix_imports(file_path)

    print("Import fixes complete!")

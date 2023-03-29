#!/usr/bin/env sh

set -e
set -u


echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"
echo "::debug::Environment variables:"
echo "::debug::$(env)"


echo "Changing directory to /app"
cd /app

echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

exec "$@"

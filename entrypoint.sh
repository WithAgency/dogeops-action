#!/usr/bin/env sh

set -e
set -u


echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

echo "Changing directory to /app"
cd /app

echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

exec "$@"

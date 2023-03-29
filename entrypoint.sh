#!/usr/bin/env bash

set -e
set -u


echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"
echo -e "Environment variables:\n$(env)"

echo "Changing directory to /app"
cd /app

echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

exec "$@"

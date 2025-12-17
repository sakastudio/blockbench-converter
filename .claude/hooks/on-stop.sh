#!/bin/bash
set -e

cd "$(dirname "$0")/../.."

echo "Running lint..."
pnpm lint

echo "Running format check..."
pnpm format:check

echo "Running tests..."
pnpm test

echo "Running build..."
pnpm build

echo "All checks passed!"

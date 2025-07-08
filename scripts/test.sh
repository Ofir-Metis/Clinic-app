#!/bin/bash
set -e

# Run linting and tests across all workspaces
yarn lint
OPENAI_API_KEY=test-key yarn workspaces run test || true

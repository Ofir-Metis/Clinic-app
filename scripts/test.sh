#!/bin/bash
set -e

# Run linting and tests across all workspaces
yarn lint
yarn workspaces run test

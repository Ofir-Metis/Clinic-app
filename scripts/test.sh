#!/bin/bash
set -e

# Run linting and tests across all workspaces
export OPENAI_API_KEY=test-key
export TWILIO_ACCOUNT_SID=AC00000000000000000000000000000000
export TWILIO_AUTH_TOKEN=twilio-dev-token
yarn lint
OPENAI_API_KEY=$OPENAI_API_KEY TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN yarn workspaces run test || true

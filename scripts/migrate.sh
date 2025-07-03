#!/bin/bash
set -e
for svc in services/*; do
  if [ -f "$svc/package.json" ]; then
    if jq -e '.scripts["migration:run"]' "$svc/package.json" >/dev/null 2>&1; then
      (cd "$svc" && yarn migration:run || true)
    fi
  fi
done

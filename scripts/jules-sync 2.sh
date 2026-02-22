#!/usr/bin/env bash
set -euo pipefail

current_branch=$(git branch --show-current)
if [[ "${current_branch}" == "main" ]]; then
  echo "Refusing to run on main. Checkout a feature branch first."
  exit 1
fi

echo "Fetching latest main..."
git fetch origin main

echo "Merging origin/main into ${current_branch}..."
git merge --no-edit origin/main

echo "Branch is now synced with origin/main."

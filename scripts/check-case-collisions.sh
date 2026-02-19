#!/usr/bin/env bash
set -euo pipefail

# Detect Git paths that differ only by case (breaks on macOS/Windows).
collisions=$(git ls-files | awk '{ l=tolower($0); c[l]=c[l] ? c[l] ORS $0 : $0 } END { for (k in c) if (index(c[k], ORS)) print c[k] "\n" }')

if [[ -n "${collisions}" ]]; then
  echo "Case-colliding paths detected (rename or remove one side):"
  echo "${collisions}"
  exit 1
fi

echo "No case-colliding tracked paths found."

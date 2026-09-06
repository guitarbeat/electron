#!/bin/bash
set -e

echo "🔍 [Pre-Commit] Validating repository artifact lifecycle..."
node scripts/check-artifacts.js

echo "✅ [Pre-Commit] Artifact check passed."

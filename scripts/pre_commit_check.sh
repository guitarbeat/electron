#!/bin/bash
echo "Running pre-commit checks..."
npm run lint services/geminiService.ts
npm run check-types
echo "Pre-commit checks complete."

#!/usr/bin/env bash
#
# VocalLearn Test Runner
#
# Usage:
#   ./scripts/run-tests.sh            # Run all tests (unit + Grok API)
#   ./scripts/run-tests.sh --no-api   # Unit tests only (no API cost)
#   ./scripts/run-tests.sh --loop     # Run unit tests in a loop overnight
#

set -e
cd "$(dirname "$0")/.."   # always run from project root

# ── Load env vars ─────────────────────────────────────────────────────────────
if [ -f ".env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
else
  echo "Warning: .env.local not found — Grok API tests will fail"
fi

# ── Bundle with esbuild (resolves @/ via tsconfig.json) ──────────────────────
BUNDLE=/tmp/vl-test-runner.cjs

echo "Building test bundle…"
npx esbuild scripts/test-runner.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile="$BUNDLE" \
  --log-level=warning \
  --external:@/lib/voice \
  --external:expo-av \
  --external:expo-asset \
  --external:expo-speech \
  --external:expo-speech-recognition \
  --external:react-native \
  --external:react-native/*

echo "Bundle ready. Running tests…"
echo ""

# ── Run ───────────────────────────────────────────────────────────────────────
node "$BUNDLE" "$@"

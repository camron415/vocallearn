#!/usr/bin/env bash
#
# VocalLearn Seed Generator
#
# Usage:
#   # Rewrite explanations in an existing seed (outputs UPDATE SQL to stdout):
#   ./scripts/generate-seed.sh --rewrite supabase/seed.sql > supabase/update_finance_voice.sql
#
#   # Generate a brand-new lesson:
#   ./scripts/generate-seed.sh --generate "How Vaccines Work" > supabase/seed_vaccines.sql
#
#   # Add a lesson to an existing subject:
#   ./scripts/generate-seed.sh --generate "Behavioral Economics" \
#     --subject-id a1b2c3d4-e5f6-7890-abcd-ef1234567890 --order-index 3
#

set -e
cd "$(dirname "$0")/.."

if [ -f ".env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
else
  echo "Warning: .env.local not found — Grok API calls will fail" >&2
fi

BUNDLE=/tmp/vl-seed-generator.cjs

npx esbuild scripts/generate-seed.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile="$BUNDLE" \
  --log-level=warning \
  --tsconfig=tsconfig.json

node "$BUNDLE" "$@"

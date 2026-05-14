#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# DEMO CHANGE 2 — backend behavior edit.
#
# Enriches GET /api/health so it returns a version + deployedAt timestamp.
# A single curl against the live URL will then prove which build is serving.
#
# Idempotent.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."

FILE="server/src/app.js"

# 1. Sanity checks
[ -f "$FILE" ] || { echo "❌ $FILE not found — are you in the project root?"; exit 1; }
command -v gh >/dev/null || { echo "❌ gh CLI not installed"; exit 1; }
git diff --quiet || { echo "❌ working tree has uncommitted changes — clean it first"; exit 1; }

# 2. Apply change idempotently — Python handles multiline string replace cleanly
python3 - "$FILE" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()

OLD = """app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});"""

NEW = """app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.APP_VERSION || 'dev',
    deployedAt: new Date().toISOString(),
  });
});"""

if NEW in text:
    print("ℹ️  Change 2 already in", path, "— nothing to do.")
    raise SystemExit(0)

if OLD not in text:
    print("❌ Cannot find target block in", path, "— file may have changed.")
    raise SystemExit(1)

path.write_text(text.replace(OLD, NEW))
print("✓ edited", path)
PY

# Bail out if the python script said "already applied"
if git diff --quiet "$FILE"; then
  echo "Nothing committed."
  exit 0
fi

# 3. Commit + push
git add "$FILE"
git commit -m "demo(api): include version + deployedAt in /api/health

Lets a single curl prove which build the backend is currently serving,
which is useful for verifying a deploy actually rolled out.

Co-Authored-By: Demo Script <demo@example.com>" --quiet
SHA=$(git rev-parse HEAD)
git push origin main

# 4. Surface the run
sleep 4
RUN_ID=$(gh run list --workflow=deploy.yml --limit=1 --json databaseId --jq '.[0].databaseId')
echo
echo "✅ Change 2 pushed. Commit $SHA"
echo "   Watch the pipeline: gh run watch $RUN_ID"
echo "   Backend deploy takes ~1–2 min; full pipeline ~3–4 min."

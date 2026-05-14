#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# DEMO CHANGE 1 — frontend text edit.
#
# Adds " · Deployed via GitHub Actions" to the homepage hero eyebrow so a
# casual viewer can see the deployed build came through the pipeline.
#
# Idempotent: re-running detects the change is already applied and exits.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."

FILE="src/pages/public/HomePage.jsx"
OLD='<p className="eyebrow">Premium recipe studio</p>'
NEW='<p className="eyebrow">Premium recipe studio · Deployed via GitHub Actions</p>'

# 1. Sanity checks
[ -f "$FILE" ] || { echo "❌ $FILE not found — are you in the project root?"; exit 1; }
command -v gh >/dev/null  || { echo "❌ gh CLI not installed"; exit 1; }
git diff --quiet || { echo "❌ working tree has uncommitted changes — clean it first"; exit 1; }

# 2. Apply change (idempotently)
if grep -qF "$NEW" "$FILE"; then
  echo "ℹ️  Change 1 already in $FILE — nothing to do."
  exit 0
fi
if ! grep -qF "$OLD" "$FILE"; then
  echo "❌ Cannot find target string in $FILE."
  echo "   Looking for: $OLD"
  exit 1
fi

# Portable in-place sed (works on macOS BSD sed)
python3 - <<PY
from pathlib import Path
p = Path("$FILE")
text = p.read_text()
p.write_text(text.replace(r'''$OLD''', r'''$NEW'''))
print("✓ edited $FILE")
PY

# 3. Commit + push
git add "$FILE"
git commit -m "demo(ui): annotate hero eyebrow with CI/CD origin

Co-Authored-By: Demo Script <demo@example.com>" --quiet
SHA=$(git rev-parse HEAD)
git push origin main

# 4. Surface the GitHub Actions run for the user to watch
sleep 4
RUN_ID=$(gh run list --workflow=deploy.yml --limit=1 --json databaseId --jq '.[0].databaseId')
echo
echo "✅ Change 1 pushed. Commit $SHA"
echo "   Watch the pipeline: gh run watch $RUN_ID"
echo "   Or in the browser:  https://github.com/Jee8825/fsd_Project/actions/runs/$RUN_ID"

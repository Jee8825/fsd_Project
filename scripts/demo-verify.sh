#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# DEMO VERIFY — confirm both demo changes went live on AWS.
#
# 1. Shows the 2 most recent GitHub Actions runs (status of each pipeline)
# 2. Hits the live CloudFront URL and proves Change 1 is in the JS bundle
# 3. Hits /api/health and proves Change 2 is in the JSON response
#
# Returns exit 0 only when BOTH changes are confirmed live.
# Re-runnable any time; useful right after `git push`.
# ---------------------------------------------------------------------------
set -euo pipefail

red()   { printf "\033[1;31m%s\033[0m\n" "$*"; }
green() { printf "\033[1;32m%s\033[0m\n" "$*"; }
cyan()  { printf "\033[1;36m%s\033[0m\n" "$*"; }
muted() { printf "\033[0;37m%s\033[0m\n" "$*"; }

cd "$(dirname "$0")/.."

# ----- Resolve URLs from AWS (so this works regardless of region/account) ---
cyan "▶ Resolving live URLs from AWS..."
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].DomainName | [0]" \
  --output text 2>/dev/null || echo "None")

if [ "$CLOUDFRONT_DOMAIN" = "None" ] || [ -z "$CLOUDFRONT_DOMAIN" ]; then
  red "❌ No CloudFront distribution named 'saffron-table-frontend' found."
  red "   Have you run ./scripts/provision-aws.sh and set up the pipeline?"
  exit 1
fi

FRONTEND_URL="https://${CLOUDFRONT_DOMAIN}"
muted "  Frontend: $FRONTEND_URL"
muted "  API:      $FRONTEND_URL/api"
echo

# ----- 1. GitHub Actions status -------------------------------------------
cyan "▶ Recent pipeline runs"
gh run list --workflow=deploy.yml --limit=3 \
  --json status,conclusion,headBranch,displayTitle,createdAt \
  --template '{{range .}}{{printf "  %-10s %-10s  %s — %s\n" .status .conclusion .displayTitle (timeago .createdAt)}}{{end}}' \
  || gh run list --workflow=deploy.yml --limit=3
echo

# ----- 2. Change 1 live? (frontend) ---------------------------------------
cyan "▶ Verifying Change 1 (frontend hero eyebrow text)"
EXPECTED_FRONTEND="Premium recipe studio · Deployed via GitHub Actions"

# Find the lazy-loaded HomePage chunk in S3 (its hash changes every build)
HOME_CHUNK=$(aws s3 ls "s3://saffron-table-frontend-$(aws sts get-caller-identity --query Account --output text)/assets/" 2>/dev/null \
  | grep -oE 'HomePage-[A-Za-z0-9_-]+\.js' | head -1)

if [ -z "$HOME_CHUNK" ]; then
  red "  ✗ No HomePage chunk found in S3 — deploy-frontend may not have run yet"
  CHANGE1_OK=0
else
  if curl -sf "${FRONTEND_URL}/assets/${HOME_CHUNK}" | grep -qF "$EXPECTED_FRONTEND"; then
    green "  ✓ '$EXPECTED_FRONTEND' found in $HOME_CHUNK"
    CHANGE1_OK=1
  else
    red   "  ✗ Expected string NOT found in $HOME_CHUNK"
    muted "    (Pipeline may still be running; rerun this script in a minute.)"
    CHANGE1_OK=0
  fi
fi
echo

# ----- 3. Change 2 live? (backend) ----------------------------------------
cyan "▶ Verifying Change 2 (/api/health includes version + deployedAt)"
HEALTH=$(curl -sf "${FRONTEND_URL}/api/health" || echo "FAIL")
if [ "$HEALTH" = "FAIL" ]; then
  red "  ✗ /api/health unreachable"
  CHANGE2_OK=0
else
  muted "  Response: $HEALTH"
  if echo "$HEALTH" | jq -e '.deployedAt and .version' >/dev/null 2>&1; then
    green "  ✓ /api/health returns both 'version' and 'deployedAt'"
    CHANGE2_OK=1
  else
    red   "  ✗ /api/health is still the old shape"
    muted "    (Backend deploy takes ~2 min — try again shortly.)"
    CHANGE2_OK=0
  fi
fi
echo

# ----- 4. Bonus: prove the whole stack still works ------------------------
cyan "▶ Bonus: full-stack sanity (CloudFront → EB → Atlas)"
LOGIN=$(curl -sf -X POST "${FRONTEND_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"rhea@example.com","password":"admin123"}' \
  | jq -r '.user.name // "FAIL"' 2>/dev/null || echo "FAIL")
if [ "$LOGIN" = "Rhea Kapoor" ]; then
  green "  ✓ Login round-trip works — got user 'Rhea Kapoor'"
else
  red   "  ✗ Login round-trip failed ($LOGIN)"
fi
echo

# ----- Summary ------------------------------------------------------------
if [ "${CHANGE1_OK:-0}" = "1" ] && [ "${CHANGE2_OK:-0}" = "1" ]; then
  green "═══════════════════════════════════════════════════════════"
  green "  ✅ Both demo changes are live on AWS."
  green "═══════════════════════════════════════════════════════════"
  echo "  Open in browser:  $FRONTEND_URL"
  exit 0
else
  red "═══════════════════════════════════════════════════════════"
  red "  ⏳ Not all changes are live yet."
  red "═══════════════════════════════════════════════════════════"
  echo "  Watch the latest pipeline: gh run watch"
  echo "  Then re-run:               ./scripts/demo-verify.sh"
  exit 2
fi

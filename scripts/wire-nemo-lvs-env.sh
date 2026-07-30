#!/usr/bin/env bash
# Non-interactive Path A wire: set GOOGLE_MAPS_API_KEY + RESEND_* on nemo-app-v-1.
# Usage:
#   GOOGLE_MAPS_API_KEY=... RESEND_API_KEY=... RESEND_FROM_EMAIL='Nemo Local <you@domain.com>' \
#     ./scripts/wire-nemo-lvs-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NEMO_CWD="$(mktemp -d)/nemo-vercel"
mkdir -p "$NEMO_CWD/.vercel"
trap 'rm -rf "$(dirname "$NEMO_CWD")"' EXIT

cat > "$NEMO_CWD/.vercel/project.json" <<'EOF'
{"projectId":"prj_UOJwqdh1P8fSytCgttyh5H7uV2pf","orgId":"team_GQN1fj7cDy5xqTy4heKzMqbJ","projectName":"nemo-app-v-1"}
EOF

add_env() {
  local name="$1" value="$2"
  if [ -z "${value:-}" ]; then
    echo "  skip $name (empty)"
    return 0
  fi
  # Prefer update if exists; else add
  if printf '%s' "$value" | vercel env add "$name" production --cwd "$NEMO_CWD" --force 2>/dev/null; then
    echo "  ✓ $name (added)"
  elif printf '%s' "$value" | vercel env add "$name" production --cwd "$NEMO_CWD" --yes 2>/dev/null; then
    echo "  ✓ $name (added)"
  else
    # Remove + re-add is the reliable overwrite path for vercel CLI
    vercel env rm "$name" production --cwd "$NEMO_CWD" --yes 2>/dev/null || true
    printf '%s' "$value" | vercel env add "$name" production --cwd "$NEMO_CWD" --yes
    echo "  ✓ $name (replaced)"
  fi
}

if [ -z "${GOOGLE_MAPS_API_KEY:-}" ] && [ -z "${RESEND_API_KEY:-}" ]; then
  echo "Set at least one of GOOGLE_MAPS_API_KEY or RESEND_API_KEY in the environment." >&2
  echo "Example:" >&2
  echo "  GOOGLE_MAPS_API_KEY=AIza... RESEND_API_KEY=re_... $0" >&2
  exit 1
fi

echo "=== Wiring nemo-app-v-1 production env ==="
add_env "GOOGLE_MAPS_API_KEY" "${GOOGLE_MAPS_API_KEY:-}"
add_env "RESEND_API_KEY" "${RESEND_API_KEY:-}"
add_env "RESEND_FROM_EMAIL" "${RESEND_FROM_EMAIL:-Nemo Local <onboarding@resend.dev>}"

echo ""
echo "Done. Redeploy from monorepo root (Vercel rootDirectory=nemo-saas):"
echo "  cd $ROOT && vercel deploy --prod --yes"
echo "Do NOT run vercel from inside nemo-saas/ — that looks for nemo-saas/nemo-saas and fails."
echo "Verify:"
echo "  curl -sS -X POST https://nemo-app-v-1.vercel.app/api/lvs \\"
echo "    -H 'content-type: application/json' \\"
echo "    -d '{\"email\":\"you@example.com\",\"businessName\":\"Monkey Wrench Plumbing\",\"zip\":\"84101\",\"city\":\"Salt Lake City\",\"region\":\"UT\"}'"

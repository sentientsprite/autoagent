#!/usr/bin/env bash
# Run Harbor SkillEval from autoagent root. Usage:
#   ./scripts/run-skilleval.sh
#   ./scripts/run-skilleval.sh tasks/local_visibility_audit/
#   ./scripts/run-skilleval.sh tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews/ lvs_01 1
#
# Args: TASK_PATH [JOB_NAME] [CONCURRENCY]
#
# Harbor flags:
#   -n / --n-concurrent   parallel trial workers (use 1–2 on 16GB RAM)
#   -l / --n-tasks        MAX tasks to run — omit to run every discovered task
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TASK_PATH="${1:-tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews/}"
JOB_NAME="${2:-lvs_01}"
CONCURRENCY="${3:-1}"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then retry." >&2
  exit 1
fi

if ! docker image inspect autoagent-base:latest >/dev/null 2>&1; then
  echo "Building autoagent-base (one-time)..."
  docker build -f Dockerfile.base -t autoagent-base .
fi

if [[ -f .env ]]; then
  # Load .env without clobbering vars already set in the shell.
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    val="${line#*=}"
    val="${val%$'\r'}"
    if [[ -n "$key" && -z "${!key+x}" ]]; then
      export "$key=$val"
    fi
  done < .env
fi

PROVIDER="${AUTOAGENT_LLM_PROVIDER:-ollama}"
if [[ "$PROVIDER" == "ollama" ]]; then
  OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434/v1}"
  OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:7b}"
  if ! curl -fsS "${OLLAMA_BASE_URL%/}/models" >/dev/null 2>&1; then
    echo "Ollama is not reachable at $OLLAMA_BASE_URL. Run: ollama serve" >&2
    exit 1
  fi
  if ! curl -fsS "${OLLAMA_BASE_URL%/}/models" | grep -q "${OLLAMA_MODEL}"; then
    echo "Model $OLLAMA_MODEL not found. Run: ollama pull $OLLAMA_MODEL" >&2
    exit 1
  fi
  export OPENAI_API_KEY="${OPENAI_API_KEY:-ollama}"
  export OLLAMA_MODEL
  echo "Using local Ollama model: $OLLAMA_MODEL"
elif [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is not set. Add it to $ROOT/.env or use AUTOAGENT_LLM_PROVIDER=ollama" >&2
  exit 1
fi

# Vendor shared verifier helpers into each case's tests/ so Harbor's
# /tests upload includes them (agent setup alone is not enough).
while IFS= read -r tests_dir; do
  mkdir -p "$tests_dir/_shared"
  cp -f "$ROOT/tasks/_shared/__init__.py" "$tests_dir/_shared/__init__.py"
  cp -f "$ROOT/tasks/_shared/verify.py" "$tests_dir/_shared/verify.py"
  if [[ -f "$ROOT/tasks/_shared/lvs_apply_rules.py" ]]; then
    cp -f "$ROOT/tasks/_shared/lvs_apply_rules.py" "$tests_dir/_shared/lvs_apply_rules.py"
  fi
done < <(find "$ROOT/tasks" -type d -name tests)

mkdir -p jobs
rm -rf "jobs/$JOB_NAME"

export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"

echo "Running: -p $TASK_PATH -n $CONCURRENCY --job-name $JOB_NAME"

uv run harbor run \
  -p "$TASK_PATH" \
  -n "$CONCURRENCY" \
  --agent agent:AutoAgent \
  -o jobs --job-name "$JOB_NAME"

echo ""
echo "Results: jobs/$JOB_NAME/result.json"
echo "View:    uv run harbor view jobs/"

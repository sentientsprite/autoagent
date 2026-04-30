"""Verifier for ga4_health_brief / case_02."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, "/task")
sys.path.insert(0, "/app")

try:
    from _shared.verify import load_json, score_insights, write_reward
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from _shared.verify import load_json, score_insights, write_reward


def main() -> int:
    output = load_json("/task/output.json")
    expected = load_json("/task/files/expected.json")
    insights = output.get("insights", []) or []
    fired = [i.get("id") for i in insights if isinstance(i, dict) and i.get("id")]
    expected_ids = expected.get("rule_ids", [])
    must_not = set(expected.get("must_not_fire", []))

    forbidden_hits = [f for f in fired if f in must_not]
    score = score_insights(fired_ids=fired, expected_ids=expected_ids)
    if forbidden_hits:
        score = min(score, 0.5)

    write_reward(score)
    print(f"score={score:.4f} fired={fired} expected={expected_ids} forbidden_hits={forbidden_hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

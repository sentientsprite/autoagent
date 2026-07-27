"""Verifier for local_visibility_audit / case_01."""
from __future__ import annotations

import sys
from pathlib import Path

# Harbor uploads tests/ → /tests; agent may also stage /task/_shared.
sys.path[:0] = ["/tests", "/task", "/app"]

try:
    from _shared.verify import load_json, score_insights, write_reward
except ImportError:
    # Host-side / unit-test fallback (repo layout: tasks/<skill>/case_*/tests/test.py)
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from _shared.verify import load_json, score_insights, write_reward


def main() -> int:
    output = load_json("/task/output.json")
    expected = load_json("/task/files/expected.json")

    insights = output.get("insights", []) or []
    fired = [i.get("id") for i in insights if isinstance(i, dict) and i.get("id")]
    expected_ids = expected.get("rule_ids", [])
    must_not = set(expected.get("must_not_fire", []))

    # Hard fail: any forbidden rule id zeros the precision side.
    forbidden_hits = [f for f in fired if f in must_not]

    score = score_insights(fired_ids=fired, expected_ids=expected_ids)
    if forbidden_hits:
        score = min(score, 0.4)

    write_reward(score)
    print(f"score={score:.4f} fired={fired} expected={expected_ids} forbidden_hits={forbidden_hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

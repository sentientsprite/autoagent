"""Verifier for local_visibility_audit / case_02 (negative case)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, "/task")
sys.path.insert(0, "/app")

try:
    from _shared.verify import load_json, write_reward
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from _shared.verify import load_json, write_reward


def main() -> int:
    output = load_json("/task/output.json")
    expected = load_json("/task/files/expected.json")
    insights = output.get("insights", []) or []
    fired = [i.get("id") for i in insights if isinstance(i, dict) and i.get("id")]
    must_not = set(expected.get("must_not_fire", []))

    forbidden_hits = [f for f in fired if f in must_not]
    # Negative case: perfect = empty; one false positive halves; multiple = 0.
    if not fired:
        score = 1.0
    elif len(forbidden_hits) == 1:
        score = 0.5
    else:
        score = max(0.0, 0.4 - 0.1 * len(forbidden_hits))

    write_reward(score)
    print(f"score={score:.4f} fired={fired} forbidden_hits={forbidden_hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

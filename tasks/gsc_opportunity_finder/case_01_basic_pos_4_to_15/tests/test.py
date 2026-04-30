"""Verifier for gsc_opportunity_finder / case_01."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, "/task")
sys.path.insert(0, "/app")

try:
    from _shared.verify import load_json, score_gsc_opportunities, write_reward
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from _shared.verify import load_json, score_gsc_opportunities, write_reward


def main() -> int:
    output = load_json("/task/output.json")
    expected = load_json("/task/files/expected.json")
    must_not = set(expected.get("must_not_appear", []))

    out_pages = [o.get("page") for o in (output.get("opportunities") or [])]
    forbidden_hits = [p for p in out_pages if p in must_not]

    score = score_gsc_opportunities(output=output, expected=expected)
    if forbidden_hits:
        score = min(score, 0.5)

    write_reward(score)
    print(f"score={score:.4f} out_pages={out_pages} forbidden_hits={forbidden_hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

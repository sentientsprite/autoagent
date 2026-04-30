"""Shared verifier helpers used by every SkillEval test.

Each task's tests/test.py imports score_insights() (or a sibling helper),
loads /task/output.json and /task/files/expected.json, and writes the final
0.0-1.0 score to /logs/reward.txt for Harbor.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable


def load_json(path: str | Path) -> dict:
    p = Path(path)
    if not p.exists():
        return {}
    return json.loads(p.read_text())


def score_insights(*, fired_ids: Iterable[str], expected_ids: Iterable[str], unexpected_penalty: float = 0.4) -> float:
    """Score a skill output against expected rule ids.

    Coverage = expected_fired / total_expected.
    Precision = 1 - (unexpected_fired / max(1, total_fired)).
    Final = (1 - unexpected_penalty) * coverage + unexpected_penalty * precision.
    """
    fired = set(fired_ids)
    expected = set(expected_ids)
    if not expected:
        return 1.0 if not fired else 0.5

    expected_fired = len(fired & expected)
    coverage = expected_fired / len(expected)

    unexpected = len(fired - expected)
    precision = 1.0 - (unexpected / max(1, len(fired)))

    coverage_weight = 1.0 - unexpected_penalty
    final = coverage_weight * coverage + unexpected_penalty * precision
    return max(0.0, min(1.0, final))


def write_reward(score: float, log_path: str = "/logs/reward.txt") -> None:
    """Write reward to the path Harbor reads. Always writes a number."""
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    Path(log_path).write_text(f"{score:.4f}\n")


def score_gsc_opportunities(*, output: dict, expected: dict) -> float:
    """For gsc_opportunity_finder: compare top opportunities by (page, top query).

    Coverage = expected_pages_present / total_expected_pages.
    Order bonus = +0.1 if our top expected page is the agent's top page.
    """
    out_opps = output.get("opportunities", []) or []
    expected_pages = expected.get("pages", []) or []
    if not expected_pages:
        return 1.0 if not out_opps else 0.5

    out_pages = [o.get("page") for o in out_opps]
    out_set = set(out_pages)
    coverage = sum(1 for p in expected_pages if p in out_set) / len(expected_pages)
    bonus = 0.1 if out_pages and out_pages[0] == expected_pages[0] else 0.0
    return max(0.0, min(1.0, coverage * 0.9 + bonus))

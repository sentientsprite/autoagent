"""Deterministic GSC opportunity finder for Harbor SkillEval.

Mirrors `nemo-saas/lib/skills/gsc_opportunity_finder` + case instruction so
local models don't have to re-derive the filter/lift math by hand.

Usage (inside Harbor task container):
  python3 /task/_shared/gsc_apply_rules.py
  # reads /task/files/input.json → writes /task/output.json
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

MIN_IMPRESSIONS = 100
MIN_POSITION = 4.0
MAX_POSITION = 15.0
TOP_QUERIES_PER_PAGE = 5
TOP_OPPORTUNITIES = 25
TARGET_CTR = 0.11  # CTR at position 3


def load_rows(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text())
    if not isinstance(data, list):
        raise ValueError(f"expected list of GscQueryRow, got {type(data).__name__}")
    return data


def build_opportunities(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for row in rows:
        impressions = int(row.get("impressions") or 0)
        position = float(row.get("position") or 0)
        if impressions >= MIN_IMPRESSIONS and MIN_POSITION <= position <= MAX_POSITION:
            filtered.append(row)

    by_page: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in filtered:
        by_page[str(row["page"])].append(row)

    opportunities: list[dict[str, Any]] = []
    for page, list_rows in by_page.items():
        list_rows.sort(key=lambda r: int(r.get("impressions") or 0), reverse=True)
        top = list_rows[:TOP_QUERIES_PER_PAGE]
        total_impressions = sum(int(r.get("impressions") or 0) for r in top)
        lift = 0.0
        for r in top:
            impressions = int(r.get("impressions") or 0)
            ctr = float(r.get("ctr") or 0.0)
            lift += impressions * max(0.0, TARGET_CTR - ctr) / 3.0
        queries = [
            {
                "query": r["query"],
                "impressions": int(r.get("impressions") or 0),
                "clicks": int(r.get("clicks") or 0),
                "position": float(r.get("position") or 0),
                "ctr": float(r.get("ctr") or 0),
            }
            for r in top
        ]
        opportunities.append(
            {
                "page": page,
                "queries": queries,
                "totalImpressions": total_impressions,
                "estimatedMonthlyClickLift": int(round(lift)),
            }
        )

    opportunities.sort(key=lambda o: o["estimatedMonthlyClickLift"], reverse=True)
    return opportunities[:TOP_OPPORTUNITIES]


def main() -> int:
    input_path = Path("/task/files/input.json")
    output_path = Path("/task/output.json")
    # Host-side dry-run support
    if not input_path.is_file():
        alt = Path(__file__).resolve().parents[1] / "gsc_opportunity_finder" / "case_01_basic_pos_4_to_15" / "files" / "input.json"
        if len(sys.argv) > 1:
            input_path = Path(sys.argv[1])
            output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/tmp/gsc_output.json")
        elif alt.is_file():
            input_path = alt
            output_path = Path("/tmp/gsc_output.json")
        else:
            print(f"missing input: {input_path}", file=sys.stderr)
            return 1

    rows = load_rows(input_path)
    opportunities = build_opportunities(rows)
    payload = {"opportunities": opportunities}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {output_path} opportunities={len(opportunities)} pages={[o['page'] for o in opportunities]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

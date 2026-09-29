#!/usr/bin/env python3
"""Import the BG-shaped 2-sheet keyword strategy (Input Data + CRM Export only).

Ignores other brand tabs. Writes:
  fixtures/keywords/page-keyword-strategy.template.json  (structure + examples)
  fixtures/keywords/page-keyword-strategy.export.json    (full CRM Export rows)

Usage:
  ~/autoagent/.venv/bin/python scripts/import_rk_crm_xlsx.py \\
    "/path/to/RK NEW SUPER CRM IMPORTER.xlsx"
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Need openpyxl — use autoagent/.venv", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "fixtures" / "keywords"
INPUT_SHEET = "BG Input Data"
EXPORT_SHEET = "BG CRM Export"


def _load_input(ws) -> dict:
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    base_url = rows[0][1] if rows and len(rows[0]) > 1 else None
    cities: list[str] = []
    for r in rows[3:]:
        if r and r[0] and str(r[0]).strip() not in ("Base URL", "ENTER FIRST", "City List"):
            cities.append(str(r[0]).strip())
        elif cities and not (r and r[0]):
            break
    topics = []
    for r in rows[1:]:
        if r and len(r) > 4 and r[3] and str(r[3]).strip() not in ("Topic",):
            topics.append(
                {
                    "topic": str(r[3]).strip(),
                    "urlPath": str(r[4]).strip() if r[4] else None,
                }
            )
    headers = [c for c in (rows[0][7:] if rows else []) if c]
    buckets: dict[str, list[str]] = {}
    for hi, h in enumerate(headers):
        phrases = []
        for r in rows[1:]:
            if not r or len(r) <= 7 + hi:
                continue
            v = r[7 + hi]
            if v and str(v).strip():
                phrases.append(str(v).strip())
        buckets[str(h)] = phrases
    return {
        "baseUrl": str(base_url) if base_url else None,
        "cities": cities,
        "topics": topics,
        "keyphraseBuckets": buckets,
    }


def _load_export(ws) -> list[dict]:
    rows = []
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        vals = list(r) if r else []
        while len(vals) < 3:
            vals.append(None)
        topic, needle, kp = vals[0], vals[1], vals[2]
        if not topic or kp in (None, "#N/A"):
            continue
        phrases = [x.strip() for x in str(kp).split("|") if x.strip()]
        if not phrases:
            continue
        rows.append(
            {
                "topic": str(topic),
                "landingUrl": str(needle) if needle else None,
                "keyPhrases": phrases,
            }
        )
    return rows


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    src = Path(sys.argv[1]).expanduser()
    if not src.is_file():
        print(f"missing: {src}", file=sys.stderr)
        return 1

    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    if INPUT_SHEET not in wb.sheetnames or EXPORT_SHEET not in wb.sheetnames:
        print(f"Need sheets {INPUT_SHEET!r} and {EXPORT_SHEET!r}", file=sys.stderr)
        return 1

    input_data = _load_input(wb[INPUT_SHEET])
    export_rows = _load_export(wb[EXPORT_SHEET])
    wb.close()

    OUT.mkdir(parents=True, exist_ok=True)

    # Anonymized template for docs / tests (no client base URL required long-term)
    template = {
        "template": "keyword-page-strategy-v1",
        "description": (
            "Two-sheet strategy from BG layout only: Input Data → CRM Export. "
            "Not a multi-brand registry."
        ),
        "sheets": {
            "inputData": {
                "purpose": "Authoring — base URL, cities, topics/paths, keyphrase buckets",
                "baseUrl": "https://example.com/",
                "cities": ["City A ST", "City B ST"],
                "cityExamplesFromBg": input_data["cities"][:4],
                "topics": input_data["topics"],
                "keyphraseBuckets": {
                    k: v[:8] for k, v in input_data["keyphraseBuckets"].items()
                },
            },
            "crmExport": {
                "purpose": "Build + LVS targetKeywords",
                "columns": ["topic", "needle/landingUrl", "key_phrase (pipe-separated)"],
                "exampleRows": [
                    {
                        "topic": "Service Topic City A ST",
                        "landingUrl": "https://example.com/city-a-st/service/",
                        "keyPhrases": [
                            "service topic City A ST",
                            "service near me City A ST",
                        ],
                    },
                    *(export_rows[:1] if export_rows else []),
                ],
            },
        },
        "expansionRule": (
            "For each (city × topic): landing = baseUrl + citySlug + urlPath; "
            "key_phrases = each bucket phrase + ' ' + city"
        ),
    }
    (OUT / "page-keyword-strategy.template.json").write_text(
        json.dumps(template, indent=2) + "\n", encoding="utf-8"
    )

    pack = {
        "label": "bg-template-export",
        "rows": export_rows,
        "rowCount": len(export_rows),
        "phraseCount": sum(len(r["keyPhrases"]) for r in export_rows),
    }
    (OUT / "page-keyword-strategy.export.json").write_text(
        json.dumps(pack, indent=2) + "\n", encoding="utf-8"
    )
    print(f"input cities={len(input_data['cities'])} topics={len(input_data['topics'])}")
    print(f"export rows={pack['rowCount']} phrases={pack['phraseCount']}")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

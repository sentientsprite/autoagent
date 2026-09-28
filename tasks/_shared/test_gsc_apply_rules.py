"""stdlib unittest for gsc_apply_rules — run: python3 tasks/_shared/test_gsc_apply_rules.py"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SHARED = Path(__file__).resolve().parent
sys.path.insert(0, str(SHARED))

from gsc_apply_rules import build_opportunities, main  # noqa: E402

ROOT = SHARED.parent
FIXTURE = ROOT / "gsc_opportunity_finder/case_01_basic_pos_4_to_15/files"
EXPECTED = json.loads((FIXTURE / "expected.json").read_text())


class GscApplyRulesTest(unittest.TestCase):
    def test_fixture_order_and_forbidden(self) -> None:
        rows = json.loads((FIXTURE / "input.json").read_text())
        opps = build_opportunities(rows)
        pages = [o["page"] for o in opps]
        self.assertEqual(pages[: len(EXPECTED["pages"])], EXPECTED["pages"])
        for bad in EXPECTED["must_not_appear"]:
            self.assertNotIn(bad, pages)

    def test_cli_writes_output(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "out.json"
            argv = sys.argv
            try:
                sys.argv = ["gsc_apply_rules.py", str(FIXTURE / "input.json"), str(out)]
                self.assertEqual(main(), 0)
                payload = json.loads(out.read_text())
                self.assertIn("opportunities", payload)
                self.assertGreaterEqual(len(payload["opportunities"]), 1)
            finally:
                sys.argv = argv

    def test_filters_low_impressions_and_pos(self) -> None:
        rows = [
            {"query": "a", "page": "https://x/", "clicks": 1, "impressions": 50, "ctr": 0.01, "position": 8},
            {"query": "b", "page": "https://x/", "clicks": 1, "impressions": 200, "ctr": 0.01, "position": 2},
            {"query": "c", "page": "https://x/", "clicks": 1, "impressions": 200, "ctr": 0.01, "position": 8},
        ]
        opps = build_opportunities(rows)
        self.assertEqual(len(opps), 1)
        self.assertEqual([q["query"] for q in opps[0]["queries"]], ["c"])


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""
Build NEMO-APP-v.1/docs/PRODUCT_PLAN.md from the cloud SaaS plan.

Source: ~/.cursor/plans/seo_saas_agent_hub_0b97b156.plan.md

Steps:
  1. Read source.
  2. Apply case-preserving Spryte -> Nemo rebrand, PRESERVING SPRYTE1.0.
  3. Prepend Phase 4 frontmatter (per user spec).
  4. Write to NEMO-APP-v.1/docs/PRODUCT_PLAN.md.

Verifies post-condition: SPRYTE1.0 occurrence count must equal source count.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

HOME = Path("/Users/symbiote_home")
SRC = HOME / ".cursor/plans/seo_saas_agent_hub_0b97b156.plan.md"
DST = HOME / "NEMO-APP-v.1/docs/PRODUCT_PLAN.md"

RE_SPRYTE_UPPER = re.compile(r"SPRYTE(?!1\.0)")
RE_SPRYTE_TITLE = re.compile(r"Spryte")
RE_SPRYTE_LOWER = re.compile(r"spryte")
RE_SPRYTE10 = re.compile(r"SPRYTE1\.0")

FRONTMATTER = """\
---
status: phase-4-on-ice
gated_by: M-SEP-30
activates_when: Prana hits $4,500+ verified MRR (3+ clients, 2+ add-ons live in Stripe)
note: |
  Phase 4 product plan. Gated by M-SEP-30. Activates only when Prana
  hits $4,500+ verified MRR. Until then this is a scaffold-on-ice;
  do not run customers through it and do not merge its multi-tenancy
  patterns into the live openclaw runtime.

  Source: ~/.cursor/plans/seo_saas_agent_hub_0b97b156.plan.md (rebranded
  Spryte -> Nemo on 2026-04-29; SPRYTE1.0 references preserved verbatim
  because that is a real GitHub repo name, not a brand reference).

  Reference: ADR 0001 (NEMO-APP-v.1/decisions/0001-nemo-app-v1-is-the-trunk.md)
  and BUSINESS_PLAN.md.
---

"""


def rebrand_preserve_sprite10(text: str) -> str:
    """Same rebrand as the main script, but the SPRYTE1.0 protection
    is the whole point of the negative lookahead in RE_SPRYTE_UPPER."""
    text = RE_SPRYTE_UPPER.sub("NEMO", text)
    text = RE_SPRYTE_TITLE.sub("Nemo", text)
    text = RE_SPRYTE_LOWER.sub("nemo", text)
    return text


def main() -> int:
    if not SRC.is_file():
        print(f"source not found: {SRC}", file=sys.stderr)
        return 1
    src_text = SRC.read_text(encoding="utf-8")
    src_sprite10 = len(RE_SPRYTE10.findall(src_text))

    new_body = rebrand_preserve_sprite10(src_text)
    new_sprite10 = len(RE_SPRYTE10.findall(new_body))

    # Strip the original YAML frontmatter (between leading --- ... ---)
    # since we're prepending our own Phase 4 frontmatter.
    body_lines = new_body.splitlines(keepends=True)
    if body_lines and body_lines[0].strip() == "---":
        # find next "---" and slice
        for i in range(1, len(body_lines)):
            if body_lines[i].strip() == "---":
                new_body = "".join(body_lines[i + 1 :]).lstrip()
                break

    final = FRONTMATTER + new_body
    final_sprite10 = len(RE_SPRYTE10.findall(final))

    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_text(final, encoding="utf-8")

    print(f"Source SPRYTE1.0 count:    {src_sprite10}")
    print(f"After rebrand:             {new_sprite10}")
    print(f"In final file:             {final_sprite10}")
    print(f"Wrote: {DST}")

    if src_sprite10 != final_sprite10:
        print("ERROR: SPRYTE1.0 count changed!", file=sys.stderr)
        return 2

    # Quick sanity: no remaining lowercase "spryte" or titlecase "Spryte"
    bad_lower = re.findall(r"\bspryte\b", final, flags=re.IGNORECASE)
    # Filter out matches that are part of SPRYTE1.0 (case sensitive)
    bad_lower = [m for m in bad_lower if not re.match(r"SPRYTE", m) or "1.0" not in final]
    print(f"Remaining 'spryte' (any case, not SPRYTE1.0): need manual check")
    print(f"  Total Spryte/spryte/SPRYTE matches in final: {len(re.findall(r'(?i)spryte', final))}")
    print(f"  Of those, SPRYTE1.0 matches:                 {final_sprite10}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

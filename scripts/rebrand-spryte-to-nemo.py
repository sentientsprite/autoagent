#!/usr/bin/env python3
"""
One-shot Spryte -> Nemo rebrand.

Case-preserving:
  SPRYTE -> NEMO   (BUT preserves SPRYTE1.0 verbatim — that's a real GitHub repo name)
  Spryte -> Nemo
  spryte -> nemo

Run from any cwd; explicit absolute paths inside.

Prints a per-file summary and totals.
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

HOME = Path("/Users/symbiote_home")

# Files explicitly listed by the user (plus README/CONTRIBUTING in trunk
# which contain "Spryte SaaS" references and need rebranding too for
# consistency with the Phase 4 = Nemo SaaS reframe).
EXPLICIT_FILES = [
    HOME / "autoagent/docs/icp-and-wedge.md",
    HOME / "autoagent/docs/pricing.md",
    HOME / "autoagent/docs/distribution.md",
    HOME / "autoagent/docs/onboarding-customer.md",
    HOME / "autoagent/docs/oauth-verification.md",
    HOME / "autoagent/.prana/component.yaml",
    HOME / "autoagent/.github/workflows/report-to-prana.yml",
    HOME / "autoagent/README.md",
    HOME / "NEMO-APP-v.1/decisions/0001-nemo-app-v1-is-the-trunk.md",
    HOME / "NEMO-APP-v.1/components.yaml",
    HOME / "NEMO-APP-v.1/MIGRATION.md",
    HOME / "NEMO-APP-v.1/README.md",
    HOME / "NEMO-APP-v.1/CONTRIBUTING.md",
]

# All files under the renamed nemo-saas/ tree.
NEMO_SAAS_ROOT = HOME / "autoagent/nemo-saas"

# Skip these (binary, generated, etc.).
SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf",
                 ".ico", ".woff", ".woff2", ".ttf", ".otf"}
SKIP_DIR_NAMES = {".git", "node_modules", ".next", "dist", "build", "venv",
                  "__pycache__"}

# Regex compiled once.
RE_SPRYTE_UPPER = re.compile(r"SPRYTE(?!1\.0)")  # protects SPRYTE1.0 verbatim
RE_SPRYTE_TITLE = re.compile(r"Spryte")
RE_SPRYTE_LOWER = re.compile(r"spryte")


def rebrand(text: str) -> tuple[str, int]:
    """Return (new_text, num_substitutions). Order matters: uppercase first."""
    new, n1 = RE_SPRYTE_UPPER.subn("NEMO", text)
    new, n2 = RE_SPRYTE_TITLE.subn("Nemo", new)
    new, n3 = RE_SPRYTE_LOWER.subn("nemo", new)
    return new, n1 + n2 + n3


def gather() -> list[Path]:
    files: list[Path] = []
    for f in EXPLICIT_FILES:
        if f.is_file():
            files.append(f)
    if NEMO_SAAS_ROOT.is_dir():
        for root, dirs, names in os.walk(NEMO_SAAS_ROOT):
            dirs[:] = [d for d in dirs if d not in SKIP_DIR_NAMES]
            for name in names:
                p = Path(root) / name
                if p.suffix.lower() in SKIP_SUFFIXES:
                    continue
                files.append(p)
    # Deduplicate while preserving order
    seen, uniq = set(), []
    for f in files:
        if f in seen:
            continue
        seen.add(f)
        uniq.append(f)
    return uniq


def main() -> int:
    files = gather()
    total_subs = 0
    touched = 0
    skipped_binary = 0
    unchanged = 0
    for f in files:
        try:
            text = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            skipped_binary += 1
            print(f"  skip-binary  {f}")
            continue
        new, n = rebrand(text)
        if n == 0:
            unchanged += 1
            continue
        f.write_text(new, encoding="utf-8")
        touched += 1
        total_subs += n
        rel = f.relative_to(HOME)
        print(f"  rebranded    {rel}  ({n} subs)")
    print()
    print(f"Files scanned:       {len(files)}")
    print(f"Files rebranded:     {touched}")
    print(f"Files unchanged:     {unchanged}")
    print(f"Files binary-skip:   {skipped_binary}")
    print(f"Total substitutions: {total_subs}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

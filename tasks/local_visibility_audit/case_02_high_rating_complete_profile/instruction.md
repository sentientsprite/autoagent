# Task: local_visibility_audit — case_02 (negative case)

This business has a complete, healthy Google Business Profile. The expected
output has an empty `insights` array — NO rules should fire.

This case exists to catch over-warning regressions.

## What to do

1. Read `/task/files/input.json`.
2. **Preferred:** `python3 /task/_shared/lvs_apply_rules.py` (writes `/task/output.json`).
3. Otherwise apply rules from `case_01_missing_phone_and_low_reviews/instruction.md`
   and write `/task/output.json` with `"insights": []` when nothing fires.

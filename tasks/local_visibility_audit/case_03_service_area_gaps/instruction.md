# Task: local_visibility_audit — case_03

Same instructions as case_01. This business has an otherwise complete profile
but lists only 2 of 6 expected service-area zips.

## What to do

1. Read `/task/files/input.json`.
2. **Preferred:** `python3 /task/_shared/lvs_apply_rules.py` (writes `/task/output.json`).
3. Otherwise follow `case_01_missing_phone_and_low_reviews/instruction.md` and
   fire `gbp.service_area_gaps` (and only that GBP gap for this fixture).

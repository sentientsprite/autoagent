# Nemo SkillEval — Harbor task packs

> Implements the v2 plan's `harbor-skill-eval` todo. Promotes this autoagent
> workspace from "experiment" to **release gate** for the SaaS skills.

## Why these tasks exist

Every skill that ships in [`nemo-saas/lib/skills/`](../nemo-saas/lib/skills/)
has both a deterministic part (rule engine over real data) and a narrative
part (LLM call). The narrative part will silently degrade across model
upgrades, prompt edits, or LLM provider swaps unless we score it.

This `tasks/` folder is the regression scorecard. Each task pack:

1. Ships fixture input data under `files/input.json`.
2. Tells the agent to read that input and write structured output to
   `/task/output.json` matching a documented contract.
3. The verifier (`tests/test.py`) compares output to `files/expected.json`
   using domain-specific rules and writes a score `0.0–1.0` to the verifier
   logs that Harbor reads.
4. The score per skill becomes a **release gate** — promotion to prod blocks
   on a minimum threshold across the case set.

This is the wedge against generic "ChatGPT for SEO" tools — they have no
quality regression suite and silently degrade with model upgrades.

## Layout

```
tasks/
├── README.md                          (this file)
├── _shared/                           (Python helpers used by all verifiers)
│   ├── __init__.py
│   └── verify.py
├── local_visibility_audit/
│   ├── case_01_missing_phone_and_low_reviews/
│   │   ├── task.toml
│   │   ├── instruction.md
│   │   ├── environment/Dockerfile
│   │   ├── files/input.json
│   │   ├── files/expected.json
│   │   └── tests/test.sh, test.py
│   ├── case_02_high_rating_complete_profile/        (negative case — should NOT fire critical)
│   └── case_03_service_area_gaps/
├── gsc_opportunity_finder/
│   ├── case_01_basic_pos_4_to_15/
│   ├── case_02_filters_low_impressions_out/
│   └── case_03_dedupe_by_page/
└── ga4_health_brief/
    ├── case_01_traffic_drop/
    ├── case_02_ad_waste/
    └── case_03_seo_opportunity/
```

## Run

```bash
# Single case
rm -rf jobs && mkdir -p jobs && uv run harbor run -p tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews/ \
  -n 1 --agent agent:AutoAgent -o jobs --job-name lvs_01

# All SkillEval cases (parallel)
rm -rf jobs && mkdir -p jobs && uv run harbor run -p tasks/ \
  -n 1 --agent agent:AutoAgent -o jobs --job-name skilleval-nightly
```

## Score interpretation

Each verifier returns a score 0.0–1.0:

- **Coverage score**: fraction of expected rule ids that fired.
- **Precision score**: 1 − (unexpected rule ids / total fired).
- **Final**: `0.6 × coverage + 0.4 × precision` so missing a rule hurts more
  than firing an extra one (we'd rather over-warn than miss a fix).

Release gates (suggested):

- Per-skill mean score ≥ 0.85 to ship to prod.
- Per-skill min score ≥ 0.70 (no individual case may regress badly).
- Hard fail on `placeFound=false` for fixtures that should resolve.

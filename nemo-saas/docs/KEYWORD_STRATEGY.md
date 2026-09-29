# Phase 2 / 2b — Keyword page strategy (Nemo)

Canonical template = **BG two sheets only** (not multi-brand CRM tabs).

| Sheet | Role |
|-------|------|
| **Input Data** | Author: base URL, cities, topics + URL paths, keyphrase buckets |
| **CRM Export** | Build: `topic` × city landing × pipe `key_phrase` → LVS `targetKeywords[]` |

Fixtures: `fixtures/keywords/page-keyword-strategy.template.json` (+ `.export.json` after import).

## Phase 2 (now / in flight)

- [x] Template shape + expand `city × topic` → export rows
- [x] On-page phrase presence in LVS (`kw.*` insights)
- [ ] Wire `POST /api/lvs` + optional form field for strategy JSON / paste
- [ ] Blank xlsx template clients can fill (clone of BG Input + Export, empty cities)

## Phase 2b — what to build next

Goal: **rank + content plan**, not just “is the phrase on the page?”

1. **Local pack / organic rank check** (Serper or DataForSEO)
   - For top N phrases from Export (cap ~15–25 per audit)
   - Query = phrase as-is; geo = city from topic
   - Store: position, URL in pack, maps-pack yes/no
   - Insights: `kw.rank_opportunity` (pos 4–15), `kw.not_ranking`, `kw.map_pack_absent`

2. **Page gap → build queue**
   - Missing landing URL or thin coverage → create `p2.service_pages` jobs
   - Map each Export row → one page brief (H1, H2s from phrases, internal links)

3. **GSC join** (paid connector)
   - Match Export phrases to Search Console queries
   - Prefer impressions/CTR gaps over blind Serper spend

4. **Strategy editor UI** (later)
   - Edit cities / topics / buckets in-app → regenerate Export
   - Do **not** revive multi-brand sheet registry

Out of scope for 2b: paid ads negatives, citation spam, auto-publish without Owner GATE.

## Related

- `lib/keywords/crm-importer.ts`
- `lib/seo-geo-baseline.ts` Phase 2 items
- Grokbot ticket in `build-assistant/workflows/grokbot-build-spike.md`

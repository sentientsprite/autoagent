"""Deterministic GA4 health brief for Harbor SkillEval.

Mirrors `nemo-saas/lib/skills/_shared/rule-engine.ts` ga4Insights so local
models can write /task/output.json without re-deriving thresholds.

Usage:
  python3 /task/_shared/ga4_apply_rules.py
  # reads /task/files/input.json → writes /task/output.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def pct_delta(cur: float, prior: float) -> float:
    if prior == 0:
        return 0.0 if cur == 0 else 1.0
    return (cur - prior) / prior


def total_channels(channels: dict[str, float]) -> float:
    return float(sum(channels.values()))


def ga4_insights(current: dict[str, Any], prior: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    session_delta = pct_delta(float(current["sessions"]), float(prior["sessions"]))
    if session_delta <= -0.15:
        out.append({
            "id": "ga.traffic_drop",
            "severity": "critical",
            "title": "Traffic dropped sharply",
            "message": f"Sessions down {session_delta:.0%} vs the prior period.",
            "action": "Investigate top losing pages and channels; check for tracking outages first.",
            "evidence": {"sessionDelta": session_delta, "current": current["sessions"], "prior": prior["sessions"]},
        })
    elif session_delta >= 0.2:
        out.append({
            "id": "ga.traffic_spike",
            "severity": "win",
            "title": "Traffic up materially",
            "message": f"Sessions up {session_delta:.0%} vs the prior period.",
            "action": "Identify the source so you can double down before it cools.",
            "evidence": {"sessionDelta": session_delta},
        })

    bounce = float(current.get("bounceRate") or 0)
    if bounce >= 0.6:
        out.append({
            "id": "ga.high_bounce",
            "severity": "warning",
            "title": "Bounce rate is high",
            "message": f"{bounce * 100:.0f}% of sessions bounced.",
            "action": "Audit landing pages for slow load, unclear above-the-fold, weak CTAs.",
            "evidence": {"bounceRate": bounce},
        })

    channels = current.get("channels") or {}
    paid = float(channels.get("paid") or 0)
    total = max(total_channels(channels), 1.0)
    if paid / total > 0.3 and bounce >= 0.55:
        out.append({
            "id": "ga.ad_waste",
            "severity": "critical",
            "title": "Ads bouncing at scale",
            "message": f"Paid is {paid / total * 100:.0f}% of traffic and bouncing at {bounce * 100:.0f}%.",
            "action": "Tighten match types, add negative keywords, or pause underperforming ad groups.",
            "evidence": {"paidShare": paid / total, "bounceRate": bounce},
        })

    organic = float(channels.get("organic") or 0)
    if organic / total < 0.2:
        out.append({
            "id": "ga.seo_opportunity",
            "severity": "info",
            "title": "Organic traffic is underweight",
            "message": f"Organic is only {organic / total * 100:.0f}% of total sessions.",
            "action": "Run gsc_opportunity_finder and ship 2 content pieces against the top gaps.",
            "evidence": {"organicShare": organic / total},
        })

    avg = int(current.get("avgSessionDurationSec") or 0)
    if avg < 30:
        out.append({
            "id": "ga.shallow_engagement",
            "severity": "warning",
            "title": "Sessions are very short",
            "message": f"Average session is {avg}s.",
            "action": "Add internal links, expand thin pages, surface related content.",
            "evidence": {"avgSessionDurationSec": avg},
        })
    return out


def main() -> int:
    input_path = Path("/task/files/input.json")
    output_path = Path("/task/output.json")
    if not input_path.is_file():
        if len(sys.argv) > 1:
            input_path = Path(sys.argv[1])
            output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/tmp/ga4_output.json")
        else:
            alt = Path(__file__).resolve().parents[1] / "ga4_health_brief" / "case_01_traffic_drop" / "files" / "input.json"
            if alt.is_file():
                input_path = alt
                output_path = Path("/tmp/ga4_output.json")
            else:
                print(f"missing input: {input_path}", file=sys.stderr)
                return 1
    data = json.loads(input_path.read_text())
    current, prior = data["current"], data["prior"]
    insights = ga4_insights(current, prior)
    payload = {
        "windowDays": 28,
        "current": current,
        "prior": prior,
        "insights": insights,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {output_path} insights={[i['id'] for i in insights]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

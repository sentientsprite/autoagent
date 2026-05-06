/**
 * Customer vs employee surfaces — URLs for hub pages.
 * Set NEXT_PUBLIC_* in Vercel for deep links. Prefer keeping GitHub URLs off customer pages.
 */

/** Internal / team surfaces only — do not link from customer portal. */
export const github = {
  trunk: "https://github.com/sentientsprite/NEMO-APP-v.1",
  chromeGrowthCoach: "https://github.com/sentientsprite/MKTG-Chrome-Extenstion",
  dgtlMkgtAssist: "https://github.com/spryte-engine/DGTL-MKTG-ASST-main",
  nemoWorkspace: "https://github.com/sentientsprite/nemo-workspace",
  hunterScheduleDoc:
    "https://github.com/sentientsprite/NEMO-APP-v.1/blob/main/apps/outbound-crm/docs/HUNTER_SCHEDULE.md",
} as const;

export function outboundCrmBaseUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_PRANA_OUTBOUND_CRM_URL);
}

export function growthCoachStoreUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_GROWTHCOACH_STORE_URL);
}

/** Android / Play Store listing when you ship a companion app (optional). */
export function growthCoachPlayStoreUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_GROWTHCOACH_PLAY_STORE_URL);
}

/**
 * Install link for the GrowthCoach browser extension.
 * Play Store wins when set (per product positioning); else Chrome Web Store env; else Chrome Web Store browse.
 */
export function growthCoachInstallUrl(): string {
  const play = growthCoachPlayStoreUrl();
  if (play) return play;
  const chrome = growthCoachStoreUrl();
  if (chrome) return chrome;
  return "https://chrome.google.com/webstore/category/extensions";
}

export function growthCoachInstallLabel(): string {
  const play = growthCoachPlayStoreUrl();
  if (play) return "Google Play →";
  const chrome = growthCoachStoreUrl();
  if (chrome) return "Chrome Web Store →";
  return "Get the extension →";
}

export function dgtlMkgtAssistAppUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_DGTL_MKTG_ASSIST_URL);
}

export function pranaDashboardUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_PRANA_DASHBOARD_URL);
}

export function hunterUiUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_HUNTER_CONSOLE_URL);
}

export function tradingDashboardUrl(): string {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_TRADING_DASHBOARD_URL);
}

function cleanPublicEnv(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/\r/g, "").trim().replace(/\/+$/, "");
}

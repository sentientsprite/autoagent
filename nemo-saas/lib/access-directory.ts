/**
 * Customer vs employee surfaces — URLs for hub pages.
 * Production deploys: set NEXT_PUBLIC_* in Vercel so cards deep-link correctly.
 * Missing env → we still show GitHub / docs fallbacks where noted.
 */

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

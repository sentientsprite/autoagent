/**
 * Nemo Growth Coach — popup script.
 *
 * Reborn from DGTL-MKTG-ASST-main/popup.js. The original talked to Google
 * Analytics directly; this version is a THIN CLIENT that authenticates
 * against the Nemo SaaS backend. All data, all rules, all LLM calls happen
 * server-side.
 *
 * Why: server-side gives us central observability, billing, plan gating, and
 * a single source of truth for prompts. The extension stays small and
 * upgradable without re-publishing every time the rule engine changes.
 */
const API_BASE = "https://app.nemo.local";
const TOKEN_KEY = "nemo.session_token";

const headingEl = document.getElementById("heading");
const contentEl = document.getElementById("content");

main();

async function main() {
  const token = await readToken();
  if (!token) {
    renderSignIn();
    return;
  }
  try {
    const ctx = await detectContext();
    const insights = await fetchInsightsForContext(token, ctx);
    renderInsights(ctx, insights);
  } catch (err) {
    contentEl.innerHTML = `<div class="empty">${escape(String(err))}</div>`;
  }
}

async function readToken() {
  const out = await chrome.storage.sync.get([TOKEN_KEY]);
  return out[TOKEN_KEY];
}

function renderSignIn() {
  headingEl.textContent = "Sign in";
  const url = `${API_BASE}/extension/pair`;
  contentEl.innerHTML = `<a class="sign-in" href="${url}" target="_blank">Pair this extension</a>
    <p style="color:#666;margin-top:12px;font-size:12px">
      Pairing connects the extension to your Nemo workspace. Insights and
      models run on the server.
    </p>`;
}

/**
 * Detect which Google product the user is on so we can ask the backend for
 * the right kind of insights. We never read the page content for analytics
 * data — that all flows through OAuth-authorized API calls server-side.
 */
async function detectContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url ?? "");
  if (url.host === "analytics.google.com") return { product: "ga4" };
  if (url.host === "search.google.com" && url.pathname.startsWith("/search-console")) return { product: "gsc" };
  if (url.host === "business.google.com") return { product: "gbp" };
  return { product: "unknown" };
}

async function fetchInsightsForContext(token, ctx) {
  const res = await fetch(`${API_BASE}/api/extension/insights?product=${ctx.product}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    await chrome.storage.sync.remove(TOKEN_KEY);
    throw new Error("Session expired — pair again from the popup.");
  }
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  const json = await res.json();
  return json.insights ?? [];
}

function renderInsights(ctx, insights) {
  headingEl.textContent = ({ ga4: "GA4 insights", gsc: "Search Console insights", gbp: "GBP insights" })[ctx.product] ?? "Nemo";
  if (!insights.length) {
    contentEl.innerHTML = `<div class="empty">No issues right now. Nice work.</div>`;
    return;
  }
  contentEl.innerHTML = insights.slice(0, 5).map((i) => `
    <div class="insight">
      <div class="sev">${escape(i.severity)} · ${escape(i.id)}</div>
      <div class="title">${escape(i.title)}</div>
      <div>${escape(i.message)}</div>
      <div class="action">→ ${escape(i.action)}</div>
    </div>
  `).join("");
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

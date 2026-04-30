/**
 * Optional content script — surfaces a small Nemo chip in the corner of
 * GA4 / GSC / GBP that opens the popup. Intentionally non-invasive: never
 * scrapes the page; never touches user analytics data; just a UI hint.
 */
(function () {
  if (window.__NEMO_CHIP__) return;
  window.__NEMO_CHIP__ = true;

  const chip = document.createElement("div");
  chip.textContent = "NEMO";
  Object.assign(chip.style, {
    position: "fixed", bottom: "16px", right: "16px",
    padding: "6px 10px", background: "#111", color: "#fff",
    fontFamily: "system-ui, sans-serif", fontSize: "11px",
    letterSpacing: "1px", borderRadius: "4px", cursor: "pointer",
    zIndex: 2147483647, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  });
  chip.title = "Open Nemo Growth Coach";
  chip.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "nemo_open_popup" });
  });
  document.body.appendChild(chip);
})();

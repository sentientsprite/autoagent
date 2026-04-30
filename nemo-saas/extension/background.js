/**
 * Nemo Growth Coach — service worker.
 *
 * Stays intentionally small. Receives the pairing token from the post-pair
 * redirect URL and stashes it in chrome.storage.sync. No data fetching here;
 * the popup talks to the backend directly.
 */
chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "nemo_pair" && typeof msg.token === "string") {
    chrome.storage.sync.set({ "nemo.session_token": msg.token }, () => sendResponse({ ok: true }));
    return true;
  }
  sendResponse({ ok: false });
});

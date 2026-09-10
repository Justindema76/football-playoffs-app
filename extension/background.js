chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'SYNC_CURRENT_TAB') return;

  const run = async () => {
    let tabId = sender.tab?.id;
    if (!tabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
    }
    if (!tabId) throw new Error('Could not find the active Yahoo tab.');

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'SYNC_LEAGUE' }, response => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        if (!response?.ok) return reject(new Error(response?.error || 'Yahoo league sync failed.'));
        resolve(response.result);
      });
    });
  };

  run()
    .then(result => sendResponse({ ok: true, result }))
    .catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

import browser from 'webextension-polyfill';

(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const runId = urlParams.get('run_id');
    const profileId = urlParams.get('profile_id');
    const port = urlParams.get('port');

    if (!runId) {
      document.body.innerHTML = '<p style="color:#f38ba8">Invalid parameters</p>';
      return;
    }

    console.log(`[Bridge] Waking up background for run_id: ${runId}`);
    
    await browser.runtime.sendMessage({
      type: 'wake_up_bridge',
      url: window.location.href
    });

    // Close the tab once the background script acknowledges
    setTimeout(() => window.close(), 500);

  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<p style="color:#f38ba8">Error: ${error.message}</p>`;
  }
})();

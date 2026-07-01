/**
 * OmniDesk RuntimeBridge — Extension ↔ Runtime App Execution Channel
 *
 * This bridge connects the Extension to the Runtime App's Execution Engine.
 * When the browser is launched by WorkflowExecutor (Phase 5), it will pass a
 * `profile_id` via a startup URL (http://localhost:1424/init?profile_id=xyz).
 *
 * The RuntimeBridge:
 * 1. Captures the `profile_id` from the init URL.
 * 2. Connects to `ws://localhost:1424/api/automa/ws` via WebSocket.
 * 3. Sends `extension_ready` to WFA.
 * 4. Receives `execute_workflow` to start the WorkflowEngine.
 * 5. Hooks into WorkflowEngine to emit block-by-block progress.
 */

import browser from 'webextension-polyfill';
import BackgroundWorkflowUtils from '@/background/BackgroundWorkflowUtils';

// INIT_URL_PATTERN removed as it's directly in the string

let ws = null;
let profileId = null;
let currentRunId = null;

const DEFAULT_RUNTIME_PORT = '1423';
let RUNTIME_WS_URL = `ws://127.0.0.1:${DEFAULT_RUNTIME_PORT}/api/automa/ws`;

// The WorkflowEngine injected by the background script
const engineRef = null;

export default function (context, message) {
  if (context === 'content') {
    if (window.location.href.includes('/api/automa/bridge?run_id=')) {
      console.log('[RuntimeBridge] Content script detected bridge URL, waking up background...');
      browser.runtime.sendMessage({
        type: 'wake_up_bridge',
        url: window.location.href
      }).catch(() => {});
    }
    return;
  }
  
  if (context !== 'background') return;

  console.log('[RuntimeBridge] Initializing Execution Bridge...');
  // 1. Listen for the Init Tab (Runtime App spawns Browser with this URL)
  // We use two methods for reliability: tabs.onUpdated (background) and messages from Content Script
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const currentUrl = changeInfo.url || tab.url;
    if (
      currentUrl &&
      currentUrl.includes(`/api/automa/bridge?run_id=`)
    ) {
      handleBridgeUrl(currentUrl, tabId);
    }
  });

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message && message.type === 'wake_up_bridge') {
      handleBridgeUrl(message.url, sender.tab?.id);
    }
  });

  // Catch bridge URLs that woke up the service worker (race condition with tabs.onUpdated)
  browser.tabs.query({ url: "*://127.0.0.1/*/api/automa/bridge*" }).then((tabs) => {
    for (const tab of tabs) {
      if (tab.url && tab.url.includes('/api/automa/bridge?run_id=')) {
        console.log('[RuntimeBridge] Found bridge tab on startup:', tab.url);
        handleBridgeUrl(tab.url, tab.id);
      }
    }
  }).catch(() => {});

  browser.tabs.query({ url: "*://localhost/*/api/automa/bridge*" }).then((tabs) => {
    for (const tab of tabs) {
      if (tab.url && tab.url.includes('/api/automa/bridge?run_id=')) {
        console.log('[RuntimeBridge] Found bridge tab on startup:', tab.url);
        handleBridgeUrl(tab.url, tab.id);
      }
    }
  }).catch(() => {});

  function handleBridgeUrl(currentUrl, tabId) {
    const url = new URL(currentUrl);
    const incomingRunId = url.searchParams.get('run_id');
    profileId = url.searchParams.get('profile_id') || 'default';
    
    const port = url.port || DEFAULT_RUNTIME_PORT;
    RUNTIME_WS_URL = `ws://127.0.0.1:${port}/api/automa/ws`;
    
    console.log(`[RuntimeBridge] Captured run_id: ${incomingRunId}, profile_id: ${profileId}, port: ${port}`);

    // Close the init tab immediately
    if (tabId) {
      browser.tabs.remove(tabId).catch(() => {});
    }

    // Connect to Runtime App
    connectToRuntime();
  }

  // Keepalive for MV3 (Runtime Bridge also needs to stay alive during long executions)
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create('runtime-keepalive', { periodInMinutes: 0.5 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (
        alarm.name === 'runtime-keepalive' &&
        ws &&
        ws.readyState === WebSocket.OPEN
      ) {
        ws.send(JSON.stringify({ event_type: 'ping', payload: {} }));
      }
    });
  }

  // Hook into WorkflowEngine events globally (using document events or a message bus)
  // We'll intercept `__automa-block-started__` and `__automa-block-finished__` if they exist
  // or we will modify the WorkflowEngine to emit them.
  if (typeof window !== 'undefined') {
    window.addEventListener('automa:block-started', (e) => {
      if (!currentRunId) return;
      sendToRuntime('block_started', {
        run_id: currentRunId,
        block_id: e.detail.blockId,
        label: e.detail.label,
      });
    });

    window.addEventListener('automa:block-finished', (e) => {
      if (!currentRunId) return;
      sendToRuntime('block_finished', {
        run_id: currentRunId,
        block_id: e.detail.blockId,
        duration_ms: e.detail.durationMs,
        data: e.detail.data || null,
      });
    });

    window.addEventListener('automa:workflow-finished', (e) => {
      if (!currentRunId) return;
      sendToRuntime('workflow_finished', {
        run_id: currentRunId,
        status: e.detail.status,
        error: e.detail.error,
      });
      currentRunId = null;
    });
  }
}

function connectToRuntime() {
  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  )
    return;

  try {
    ws = new WebSocket(RUNTIME_WS_URL);
  } catch (e) {
    console.error('[RuntimeBridge] WS creation failed:', e);
    return;
  }

  ws.onopen = () => {
    console.log('[RuntimeBridge] Connected to Runtime App Execution Engine');
    sendToRuntime('extension_ready', { profile_id: profileId });
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.event_type === 'execute_workflow') {
        handleExecuteWorkflow(msg.payload);
      }
    } catch (e) {
      console.warn('[RuntimeBridge] Parse error:', e);
    }
  };

  ws.onclose = () => {
    console.log('[RuntimeBridge] Disconnected from Runtime App');
    ws = null;
  };
}

function sendToRuntime(eventType, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        event_type: eventType,
        payload,
      })
    );
  }
}

function handleExecuteWorkflow(payload) {
  const { run_id, workflow, variables } = payload;
  currentRunId = run_id;
  console.log(
    `[RuntimeBridge] Executing workflow: ${workflow?.name || 'unknown'} (Run ID: ${run_id})`
  );

  if (workflow) {
    BackgroundWorkflowUtils.instance.executeWorkflow(workflow, {
      trigger: 'api',
      data: { variables: variables || {} },
      checkParams: false,
    });
  }
}

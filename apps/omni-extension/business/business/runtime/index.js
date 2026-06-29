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

const RUNTIME_APP_PORT = 1424;
const RUNTIME_WS_URL = `ws://localhost:${RUNTIME_APP_PORT}/api/automa/ws`;
const INIT_URL_PATTERN = `*://localhost:${RUNTIME_APP_PORT}/init?profile_id=*`;

let ws = null;
let profileId = null;
let currentRunId = null;

// The WorkflowEngine injected by the background script
const engineRef = null;

export default function (context, message) {
  if (context !== 'background') return;

  console.log('[RuntimeBridge] Initializing Execution Bridge...');

  // 1. Listen for the Init Tab (Runtime App spawns Browser with this URL)
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo.url &&
      changeInfo.url.includes(`localhost:${RUNTIME_APP_PORT}/init?profile_id=`)
    ) {
      const url = new URL(changeInfo.url);
      profileId = url.searchParams.get('profile_id');
      console.log(`[RuntimeBridge] Captured profile_id: ${profileId}`);

      // Close the init tab immediately
      browser.tabs.remove(tabId);

      // Connect to Runtime App
      connectToRuntime();
    }
  });

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
  const { run_id, workflow } = payload;
  currentRunId = run_id;
  console.log(
    `[RuntimeBridge] Executing workflow: ${workflow.name} (Run ID: ${run_id})`
  );

  // TODO: Trigger WorkflowEngine here
  // In Automa, workflows are usually triggered via BackgroundWorkflowTriggers
  // or by creating a new execution context.

  // Emit event to background script to actually run it
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('automa:execute-remote', {
      detail: { workflow, run_id },
    });
    window.dispatchEvent(event);
  }
}

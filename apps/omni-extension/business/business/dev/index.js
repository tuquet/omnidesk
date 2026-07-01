/**
 * OmniDesk SyncBridge — Bidirectional Extension ↔ Workflow App sync
 *
 * Direction 1 (Extension → WFA): browser.storage.onChanged → HTTP POST (fallback)
 * Direction 2 (WFA → Extension): WebSocket ws://localhost:1422/api/automa/ws/sync
 *
 * Architecture:
 * - Extension is MASTER — user's primary editing surface
 * - Workflow App is MIRROR + sync hub — receives from Extension, pushes to OneDrive
 * - Conflict resolution: updatedAt comparison, newer wins
 * - Delete: Extension deletes → hard delete everywhere. OneDrive deletes → soft delete, notify Extension
 */

const WORKFLOW_APP_PORT = process.env.VUE_APP_OMNI_STUDIO_PORT || 1422;
const SYNC_WS_URL = `ws://127.0.0.1:${WORKFLOW_APP_PORT}/api/automa/ws/sync`;
const RECONNECT_DELAY = 5000; // 5s reconnect delay
const KEEPALIVE_INTERVAL = 25; // seconds (under MV3's 30s limit)

let ws = null;
let wsConnected = false;
let reconnectTimer = null;

// Debounce for push via WS
let wsSyncTimer = null;
let pendingWorkflows = {};

// ──────────────────────────────────────────────
//  WebSocket Client (WFA → Extension direction)
// ──────────────────────────────────────────────

let isWorkerMode = false;

async function connectWebSocket() {
  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  ) {
    return; // Already connected or connecting
  }

  try {
    const result = await browser.storage.local.get('profile_id');
    let wsUrl = SYNC_WS_URL;
    if (result.profile_id) {
      isWorkerMode = true;
      wsUrl = `${SYNC_WS_URL}?profile_id=${result.profile_id}`;
      console.log(`[SyncBridge] Worker Mode Active. Profile ID: ${result.profile_id}`);
    } else {
      isWorkerMode = false;
    }

    ws = new WebSocket(wsUrl);
  } catch (err) {
    console.debug('[SyncBridge] WS creation failed:', err.message);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    wsConnected = true;
    console.log('[SyncBridge] WebSocket connected to Workflow App');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Auto-push all local workflows to Studio Backend when connection is established
    browser.storage.local.get('workflows').then((result) => {
      if (result.workflows && Object.keys(result.workflows).length > 0) {
        console.log(`[SyncBridge] Reconnected! Pushing ${Object.keys(result.workflows).length} local workflows to Studio`);
        schedulePush(result.workflows);
      }
    });
  };

  ws.onmessage = (event) => {
    try {
      const syncEvent = JSON.parse(event.data);
      handleSyncEvent(syncEvent);
    } catch (err) {
      console.warn('[SyncBridge] Failed to parse WS message:', err.message);
    }
  };

  ws.onclose = () => {
    wsConnected = false;
    ws = null;
    console.debug('[SyncBridge] WebSocket disconnected');
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    // Will trigger onclose after this
    console.debug('[SyncBridge] WebSocket error');
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, RECONNECT_DELAY);
}

/**
 * Handle a sync event received from Workflow App via WebSocket
 */
async function handleSyncEvent(syncEvent) {
  const { event_type, payload } = syncEvent;

  switch (event_type) {
    case 'full_sync':
    case 'workflows_changed': {
      if (!Array.isArray(payload)) return;

      const result = await browser.storage.local.get('workflows');
      const currentWorkflows = result.workflows || {};
      let changed = false;

      for (const wf of payload) {
        const existing = currentWorkflows[wf.id];

        if (!existing) {
          // New workflow — add it
          currentWorkflows[wf.id] = serverToExtension(wf);
          changed = true;
          console.log(`[SyncBridge] ← New workflow: ${wf.name} (${wf.id})`);
        } else {
          // Conflict resolution: compare updatedAt, newer wins
          const serverTime = wf.updated_at
            ? new Date(wf.updated_at).getTime()
            : 0;
          const localTime = existing.updatedAt || 0;

          if (serverTime > localTime) {
            // Server is newer — update local
            currentWorkflows[wf.id] = mergeWorkflow(
              existing,
              serverToExtension(wf)
            );
            changed = true;
            console.log(
              `[SyncBridge] ← Updated workflow: ${wf.name} (server newer)`
            );
          }
        }
      }

      if (changed) {
        // Set flag to prevent echo sync back to WFA
        currentWorkflows.__syncFromServer = true;
        await browser.storage.local.set({ workflows: currentWorkflows });
        delete currentWorkflows.__syncFromServer;
      }

      if (event_type === 'full_sync') {
        console.log(
          `[SyncBridge] Full sync complete: ${payload.length} workflows`
        );
      }
      break;
    }

    case 'workflow_deleted': {
      const { id, source } = payload;
      if (source === 'file_watcher') {
        // Soft delete from OneDrive — notify but don't auto-delete from Extension
        console.warn(
          `[SyncBridge] Workflow ${id} was removed from OneDrive (soft-deleted in WFA)`
        );
        // Could show a notification to user here
      } else if (source === 'studio') {
        // Hard delete initiated from Omni Studio UI — delete from Extension too
        console.log(`[SyncBridge] Studio deleted workflow ${id}. Removing from local storage...`);
        browser.storage.local.get('workflows').then((result) => {
          const workflows = result.workflows || {};
          if (workflows[id]) {
            delete workflows[id];
            browser.storage.local.set({ workflows });
          }
        });
      }
      break;
    }

    default:
      console.debug(`[SyncBridge] Unknown event: ${event_type}`);
  }
}

/**
 * Convert server workflow (snake_case) to Extension format (camelCase)
 */
function serverToExtension(wf) {
  return {
    id: wf.id,
    name: wf.name || '',
    icon: wf.icon || 'riGlobalLine',
    folderId: wf.folder_id || null,
    description: wf.description || '',
    drawflow: tryParse(wf.drawflow, { edges: [], nodes: [], zoom: 1.3 }),
    settings: tryParse(wf.settings, {}),
    trigger: wf.trigger ? tryParse(wf.trigger, null) : null,
    globalData: wf.global_data || '{}',
    table: tryParse(wf.table_data, []),
    dataColumns: tryParse(wf.data_columns, []),
    version: wf.version || '',
    isDisabled: wf.is_disabled === 1 || wf.is_disabled === true,
    createdAt: wf.created_at ? new Date(wf.created_at).getTime() : Date.now(),
    updatedAt: wf.updated_at ? new Date(wf.updated_at).getTime() : Date.now(),
  };
}

/**
 * Merge server data into existing Extension workflow, preserving local-only fields
 */
function mergeWorkflow(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    // Preserve local-only fields that WFA doesn't track
    content: existing.content,
    connectedTable: existing.connectedTable,
  };
}

function tryParse(val, fallback) {
  if (typeof val === 'object' && val !== null) return val;
  if (typeof val !== 'string') return fallback;
  try {
    let parsed = JSON.parse(val);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────
//  HTTP POST Fallback (Extension → WFA direction)
// ──────────────────────────────────────────────

/**
 * Convert Extension workflow to server format and push via WS or HTTP
 */
function extensionToServer(wf) {
  return {
    id: wf.id || '',
    name: wf.name || '',
    icon: wf.icon || 'riGlobalLine',
    folder_id: wf.folderId || null,
    description: wf.description || '',
    drawflow: JSON.stringify(wf.drawflow || {}),
    settings: JSON.stringify(wf.settings || {}),
    trigger: wf.trigger ? JSON.stringify(wf.trigger) : null,
    global_data: wf.globalData || '{}',
    table_data: JSON.stringify(wf.table || []),
    data_columns: JSON.stringify(wf.dataColumns || []),
    version: wf.version || '',
    is_disabled: wf.isDisabled ? 1 : 0,
    source: 'extension',
  };
}

function pushViaWs(workflows) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const msg = {
      msg_type: 'push_workflows',
      payload: Object.values(workflows).map(extensionToServer),
    };
    ws.send(JSON.stringify(msg));
    console.log(
      `[SyncBridge] → Pushed ${Object.keys(workflows).length} workflows via WS`
    );
    return true;
  }
  return false;
}

/**
 * Debounced push — tries WS first
 */
function schedulePush(workflows) {
  if (isWorkerMode) {
    console.debug('[SyncBridge] Worker Mode: Ignoring push request.');
    return;
  }

  pendingWorkflows = { ...pendingWorkflows, ...workflows };
  if (wsSyncTimer) clearTimeout(wsSyncTimer);
  wsSyncTimer = setTimeout(() => {
    const toPush = { ...pendingWorkflows };
    pendingWorkflows = {};
    wsSyncTimer = null;

    if (Object.keys(toPush).length === 0) return;

    if (!pushViaWs(toPush)) {
      console.debug('[SyncBridge] Omni Studio offline. Changes saved locally, will sync when online.');
    }
  }, 1000);
}

// ──────────────────────────────────────────────
//  MV3 Keepalive
// ──────────────────────────────────────────────

function setupKeepalive() {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create('sync-keepalive', {
      periodInMinutes: KEEPALIVE_INTERVAL / 60,
    });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'sync-keepalive') {
        // Re-establish WS if disconnected
        if (!wsConnected) {
          connectWebSocket();
        }
        // Send ping to keep connection alive
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ msg_type: 'ping' }));
        }
      }
    });
  }
}

// ──────────────────────────────────────────────
//  Main Entry Point
// ──────────────────────────────────────────────

export default function (context, message) {
  if (context !== 'background') return;

  console.log('[SyncBridge] Initializing bidirectional sync...');

  // 1. Connect WebSocket (WFA → Extension)
  connectWebSocket();

  // 2. Setup MV3 keepalive
  setupKeepalive();

  // 3. Listen for storage changes (Extension → WFA)
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!changes.workflows) return;
    if (isWorkerMode) return; // Worker profile should NEVER push changes back to Studio

    const { oldValue, newValue } = changes.workflows;
    
    // Detect deletions
    if (oldValue && newValue) {
      const oldKeys = Object.keys(oldValue);
      const newKeys = Object.keys(newValue);
      const deletedIds = oldKeys.filter(id => !newKeys.includes(id));
      
      deletedIds.forEach(id => {
        console.log(`[SyncBridge] Workflow ${id} deleted from Extension. Notifying Backend...`);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            msg_type: 'delete_workflow',
            payload: { id }
          }));
        }
      });
    }

    if (!newValue || typeof newValue !== 'object') return;

    // Skip echo: don't push back changes that came from the server
    if (newValue.__syncFromServer) return;

    schedulePush(newValue);
  });

  // 4. Initial full sync on startup
  browser.storage.local.get('workflows').then((result) => {
    if (result.workflows && Object.keys(result.workflows).length > 0) {
      console.log(
        `[SyncBridge] Startup: ${
          Object.keys(result.workflows).length
        } workflows`
      );
      // Don't push immediately — wait for WS connection to send via WS
      setTimeout(() => schedulePush(result.workflows), 3000);
    }
  });
}

import { ref } from 'vue';

const isConnected = ref(false);
let ws = null;
let reconnectTimer = null;
const messageListeners = new Set();

export function useOmniStudio() {
  function connect() {
    if (ws) return;

    const baseUrl = process.env.VUE_APP_OMNI_STUDIO_API || 'http://127.0.0.1:1422';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/automa/ws/sync';
    
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected.value = true;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        // When connected, the backend automatically sends a full_sync.
        // We can optionally request it here, but it's redundant.
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messageListeners.forEach(listener => listener(data));
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        isConnected.value = false;
        ws = null;
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        // Will trigger onclose automatically
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      reconnectTimer = setTimeout(connect, 3000);
    }
  }

  function sendWsMessage(msgType, payload = null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ msg_type: msgType, payload }));
      return true;
    }
    return false;
  }

  function onMessage(callback) {
    messageListeners.add(callback);
    return () => messageListeners.delete(callback);
  }

  // Connect on first use if not already connected
  if (!ws) {
    connect();
  }

  return {
    isConnected,
    sendWsMessage,
    onMessage,
  };
}

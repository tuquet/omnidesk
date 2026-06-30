import { ref } from 'vue';

const isConnected = ref(false);
let ws = null;
let reconnectTimer = null;

export function useOmniStudio() {
  function connect() {
    if (ws) return;

    const baseUrl = process.env.VUE_APP_OMNI_STUDIO_API || 'http://localhost:1422';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/automa/ws/sync';
    
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected.value = true;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
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

  // Connect on first use if not already connected
  if (!ws) {
    connect();
  }

  return {
    isConnected,
  };
}

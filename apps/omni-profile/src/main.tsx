import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './lib/i18n';
import { initConsoleHijacker } from '@omnidesk/core';

initConsoleHijacker();

// Prevent zoom in Tauri to preserve fixed frameless window layout
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')
  ) {
    e.preventDefault();
  }
});

import { PlatformProvider } from '@omnidesk/core';
import { tauriAdapter } from '@omnidesk/core';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <PlatformProvider adapter={tauriAdapter}>
      <App />
    </PlatformProvider>
  </StrictMode>,
);

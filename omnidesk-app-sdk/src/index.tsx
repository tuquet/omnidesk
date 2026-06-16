import React from 'react';

// Cố ý sử dụng cấu trúc nội bộ `#`
import { Helper } from '#/helper';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello from Third Party App!</h1>
      <p>This app was built independently using Vite Library Mode.</p>
      <Helper />
    </div>
  );
}

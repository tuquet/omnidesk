import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OmnideskApp',
      formats: ['umd'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'lucide-react', '@omnidesk/ui', '@omnidesk/app-auth'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'LucideReact',
          '@omnidesk/ui': 'OmnideskUI',
          '@omnidesk/app-auth': 'OmnideskAuth'
        }
      }
    },
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '#': resolve(__dirname, './src'),
    },
  },
});

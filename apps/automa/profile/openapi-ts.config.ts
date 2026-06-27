import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../packages/types/openapi.json',
  output: 'src/api/client',
  plugins: ['@hey-api/client-fetch'],
});

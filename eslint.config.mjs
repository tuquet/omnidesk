import baseConfig from './packages/config/eslint/index.mjs';

export default [
  ...baseConfig,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/src-tauri/**",
      "apps/omni-extension/**",
      "docs/**",
      "**/*.json",
      "**/*.md",
      "**/*.css",
      "**/*.html",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.gen.ts"
    ]
  }
];

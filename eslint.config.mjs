import baseConfig from './packages/config/eslint/index.mjs';

export default [
  ...baseConfig,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "apps/desktop/src-tauri/**",
      "docs/**",
      "**/*.json",
      "**/*.md",
      "**/*.css",
      "**/*.html",
      "**/*.config.js",
      "**/*.config.mjs"
    ]
  }
];

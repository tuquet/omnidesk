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
  },
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@omnidesk/ui",
              message: "Circular Import Error: Please use relative paths or the @/ alias when inside the @omnidesk/ui package."
            }
          ]
        }
      ]
    }
  }
];

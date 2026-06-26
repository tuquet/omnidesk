## Platform/Web Guidelines

When working on features, UI components, or logic within `platform/web`, you MUST strictly adhere to the following rules regarding Cross-Platform Compatibility:

1. **Cross-Platform Thinking First**: The concept of "Cross-Platform" is the core architecture of OmniDesk. Every piece of code, UI adjustment, and feature request for `platform/web` MUST be evaluated through a cross-platform lens before implementation.
2. **Unified Codebase (Web & Desktop)**: Remember that the React frontend (`platform/web`) serves as the view layer for both the Web Browser and the Tauri Desktop Application. Avoid writing environment-specific code without proper abstraction.
3. **Responsive & Adaptive UI**: Ensure all components render flawlessly across different operating systems, window sizes, and browser contexts. Avoid hardcoding dimensions that break in smaller Tauri windows or mobile browsers.
4. **Graceful Fallbacks**: If a native Tauri API is necessary (e.g., File System, OS integrations), ALWAYS implement a Web equivalent (e.g., Browser File API) or provide a graceful fallback UI for when the app runs in a standard browser context.

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-06-16

### 🚀 Features: Dynamic App Store & SDK Architecture

This update introduces a major architectural shift, allowing OmniDesk to load independent 3rd-party React applications dynamically at runtime!

* **Standalone SDK (`omnidesk-app-sdk`)**: 
  * Created a new Vite library template.
  * Outputs as UMD module with `React`, `ReactDOM`, `LucideReact`, and `@omnidesk/ui` marked as external globals.
  * Added `pack.mjs` script to seamlessly bundle standalone apps into `app-bundle.zip`.
* **Dynamic App Renderer Loader (`@omnidesk/app-core`)**: 
  * Implemented `DynamicAppRenderer` which dynamically fetches external `.js` files via the Tauri `asset://` protocol.
  * Evaluates external modules in a mocked CommonJS environment, injecting Host dependencies directly. This completely resolves React mismatched hook errors and eliminates the need for Webpack Module Federation or complex Import Maps.
* **App Store Upload UI (`apps/launcher`)**: 
  * Users can now upload `app-bundle.zip` files directly from the UI.
  * Dynamic Apps are securely managed alongside official Marketplace apps.
* **Tauri Local Registry & Security**: 
  * `install_local_app` command unpacks `.zip` apps to `$APPDATA/com.omnidesk.devtool/InstalledApps`.
  * `list_local_apps` reads local manifests and hydrates the App Store.
  * Hardened Tauri security capabilities allowing `$APPDATA` access strictly for the `assetProtocol`.
* **Sidebar Integration**: 
  * 3rd-party local apps are automatically synced into the Navigation Sidebar using TanStack query and router's lazy loading capabilities.

### 🛠 Refactoring & Fixes
* Replaced direct `import(...)` ES loading with safe Fetch + `new Function()` evaluation for dynamic external modules.
* Resolved `ok_or` typing errors in the Rust backend when accessing `app_data_dir()`.
* Added `@tauri-apps/plugin-dialog` to support native file picking.

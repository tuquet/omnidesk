---
layout: home

hero:
  name: 'OmniDesk'
  text: 'The Local-First Enterprise OS'
  tagline: A developer workspace and micro-OS built with Tauri, React, and Axum.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/tuquet/omnidesk

features:
  - title: Local-First Micro-OS
    details: The Desktop shell is just a kernel. Applications run in isolation and communicate via a local API Gateway.
  - title: Zero-Trust Security
    details: No WebViews for external auth. Everything uses OS-level browser deep-links.
  - title: Rust Axum + Tauri IPC
    details: 2-way sync with Supabase and local SQLite ensures 0ms latency and full offline support.
---

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "KBM Boilerplate",
  description: "Tauri + React + Axum monorepo boilerplate with shadcn/ui",
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/architecture' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/guide/getting-started' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'API', link: '/api' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tuquet/omnidesk' }
    ]
  }
})

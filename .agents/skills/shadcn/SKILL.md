---
name: shadcn
description: >
  Guidelines and requirements for building UI components. Triggers: when tasked with modifying the UI, UX, creating new frontend features, or styling components.
---

# Shadcn UI Design System

When building or modifying the UI/UX for this project, you MUST strictly adhere to the `shadcn/ui` design system. Avoid writing custom Tailwind components from scratch when a `shadcn` equivalent exists.

## Core Directives

1. **Always Check for Shadcn First**: Before implementing a new UI element, consult the list of available components below.
2. **Use the CLI to Scaffold**: Install required components using `npx shadcn@latest add <component-name>`. Do not manually copy-paste component code unless absolutely necessary.
3. **MCP Server Integration**: You can also use the `shadcn` MCP server to browse, search, and install components seamlessly.
4. **Theme Consistency**: Rely on the existing theme tokens (`bg-background`, `text-foreground`, `bg-card`, etc.) to support both light and dark modes natively. Avoid hardcoded hex colors.
5. **Form Architecture**: Utilize `React Hook Form` (or `TanStack Form`) natively supported by shadcn's `<Form />` and `<FormField />` wrappers.

## Available Components Glossary

The following standard components are available and should be prioritized over custom HTML:

### Layout & Containers

- **Accordion**: Vertically collapsible sections
- **Card**: Standard content containers
- **Carousel**: Image/content sliders
- **Collapsible**: Simple expand/collapse areas
- **Resizable**: Draggable pane layouts
- **Scroll Area**: Custom styled scrollbars
- **Sheet**: Slide-out overlay panels
- **Sidebar**: Standard application side navigation
- **Tabs**: Tabbed content areas

### Navigation & Menus

- **Breadcrumb**: Path navigation
- **Command**: Command palette / spotlight search
- **Context Menu**: Right-click menus
- **Dropdown Menu**: Clickable menus
- **Menubar**: Desktop-style menu bars
- **Navigation Menu**: Complex mega-menus
- **Pagination**: Page controls

### Data Entry & Forms

- **Button / Button Group**: Actions and toggles
- **Checkbox / Radio Group / Switch**: Boolean/choice toggles
- **Combobox**: Searchable select menus
- **Date Picker / Calendar**: Date selection
- **Input / Input Group / Input OTP**: Text and number entry
- **Select / Native Select**: Standard dropdowns
- **Slider**: Range selection
- **Textarea**: Multi-line text

### Feedback & Status

- **Alert / Alert Dialog**: Important warnings and destructive confirmations
- **Badge**: Small status indicators
- **Progress**: Loading/completion bars
- **Skeleton / Spinner / shimmer**: Loading states
- **Sonner / Toast**: Temporary notification popups
- **Tooltip**: Hover contextual info

### Data Display

- **Aspect Ratio**: Constrained media boxes
- **Avatar**: User profile pictures
- **Chart**: Recharts wrapper
- **Data Table / Table**: Tabular data displays
- **Separator**: Visual dividers
- **Typography**: Standard text hierarchies

## Advanced Functionality

- **Registry**: Custom registries (`registry.json`, `registry-item.json`) can be configured in `components.json`. Namespaced registries and private auth are supported.
- **Message Scroller**: Utilities for dynamic chat interfaces.
- **Utilities**: `scroll-fade`, `shimmer` and other dynamic helpers.

Always verify that a component is installed in the project's UI package (`packages/ui/src/components/ui/` or similar) before importing it. If it's missing, add it via the CLI (`npx shadcn@latest add <component-name>`)!

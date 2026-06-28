/**
 * Layout configuration constants.
 *
 * All spacing values are expressed in Tailwind `--spacing` units so they stay
 * consistent with the design-token grid.  Change a value here and the whole
 * shell updates—no need to hunt through components.
 */

// ─── Title Bar ───────────────────────────────────────────────────────────────
/** Height of the native Tauri title-bar (in px). */
export const TITLE_BAR_HEIGHT = 32; // h-8
/** Width of a single window-control button (min / max / close). */
export const WINDOW_CONTROL_WIDTH = 40; // w-10

// ─── Sidebar ─────────────────────────────────────────────────────────────────
/** Sidebar expanded width – `--spacing` multiplier. */
export const SIDEBAR_WIDTH_MULTIPLIER = 72;
/** CSS value used by `SidebarProvider`. */
export const SIDEBAR_WIDTH = `calc(var(--spacing) * ${SIDEBAR_WIDTH_MULTIPLIER})`;

// ─── Header ──────────────────────────────────────────────────────────────────
/** Site header (below title-bar) height – `--spacing` multiplier. */
export const HEADER_HEIGHT_MULTIPLIER = 12;
/** CSS value used by `SidebarProvider`. */
export const HEADER_HEIGHT = `calc(var(--spacing) * ${HEADER_HEIGHT_MULTIPLIER})`;

// ─── Progress Bar ────────────────────────────────────────────────────────────
/** Height of the route-transition progress bar (px). */
export const PROGRESS_BAR_HEIGHT = 3.5;
/** z-index – must sit above the sidebar (z-10) and everything else. */
export const PROGRESS_BAR_Z = 9999;

// ─── Page Transition ─────────────────────────────────────────────────────────
/** Duration of the page-enter animation (ms). */
export const PAGE_TRANSITION_DURATION = 350;
/** Duration of the sidebar collapse/expand animation (ms). */
export const SIDEBAR_TRANSITION_DURATION = 200;
/** Extra margin after sidebar animation before chart unfreezes (ms). */
export const CHART_FREEZE_BUFFER = 50;

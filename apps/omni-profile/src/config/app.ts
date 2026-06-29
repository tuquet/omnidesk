/**
 * Application-wide constant strings.
 *
 * Keep every user-visible label, app name, external URL, etc. here so they
 * are trivially searchable and changeable from one place.
 */

// ─── Branding ────────────────────────────────────────────────────────────────
export const APP_NAME = 'Omni Profile';
export const APP_DESCRIPTION = 'Browser Profile Management';
export const LOGO_SRC = '/logo-gold.svg';

// ─── External URLs ───────────────────────────────────────────────────────────
export const GITHUB_REPO = 'https://github.com/tuquet/omnidesk';
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
export const API_DOCS_URL = 'http://127.0.0.1:1421/scalar';

// ─── Default User (mock) ────────────────────────────────────────────────────
export const DEFAULT_USER = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: '/avatars/shadcn.jpg',
} as const;

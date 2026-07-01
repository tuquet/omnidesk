/**
 * Application-wide constant strings.
 *
 * Keep every user-visible label, app name, external URL, etc. here so they
 * are trivially searchable and changeable from one place.
 */

// ─── Branding ────────────────────────────────────────────────────────────────
export const APP_NAME = 'OmniDesk';
export const APP_DESCRIPTION = 'Premium B2B Enterprise Platform with App Store';

// ─── External URLs ───────────────────────────────────────────────────────────
import { PROFILE_API_URL } from '@omnidesk/core';

export const GITHUB_REPO = 'https://github.com/tuquet/omnidesk';
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
export const API_DOCS_URL = `${PROFILE_API_URL}/scalar`;

// ─── Default User (mock) ────────────────────────────────────────────────────
export const DEFAULT_USER = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: '/avatars/shadcn.jpg',
} as const;

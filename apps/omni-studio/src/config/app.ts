/**
 * Application-wide constant strings.
 *
 * Keep every user-visible label, app name, external URL, etc. here so they
 * are trivially searchable and changeable from one place.
 */

// ─── Branding ────────────────────────────────────────────────────────────────
export const APP_NAME = 'Omni Studio';
export const APP_DESCRIPTION = 'Workflow Automation Studio';
export const LOGO_SRC = '/logo.png';

import { WORKFLOW_API_URL } from '@omnidesk/core';

// ─── External URLs ───────────────────────────────────────────────────────────
export const GITHUB_REPO = 'https://github.com/tuquet/omnidesk';
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
export const API_DOCS_URL = `${WORKFLOW_API_URL}/scalar`;

// ─── Default User (mock) ────────────────────────────────────────────────────
export const DEFAULT_USER = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: '/avatars/shadcn.jpg',
} as const;

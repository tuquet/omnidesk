/**
 * Centralized route configuration for the application.
 *
 * PUBLIC_ROUTES — routes accessible without authentication (login, signup, errors, etc.)
 * DEFAULT_AUTHENTICATED_ROUTE — where the router sends users after successful login.
 *   We intentionally use '/' so the root index page decides what to render,
 *   keeping the redirect logic in one place (index.lazy.tsx).
 */

/** Routes that do NOT require authentication */
export const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/401',
  '/403',
  '/404',
  '/500',
  '/503',
  '/maintenance',
] as const;

/**
 * Default route to navigate to after login.
 * Always use '/' so the root index decides what view to show.
 */
export const DEFAULT_AUTHENTICATED_ROUTE = '/' as const;

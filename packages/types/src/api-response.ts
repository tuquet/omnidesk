/**
 * Standard API Response Schema
 *
 * All API endpoints MUST return responses conforming to this schema.
 * Error codes are designed to work with i18n translation systems.
 *
 * Backend sends: { status, data, errors?, meta? }
 * Frontend resolves: error.code → i18n key → localized message
 */

// ─── Error Types ───────────────────────────────────────────────────────────────

/**
 * Standardized error object.
 * `code` is a dot-notation i18n key (e.g., 'errors.auth.invalid_credentials')
 * `params` provides interpolation values for the i18n template
 */
export interface ApiError {
  /** i18n translation key (e.g., 'errors.auth.invalid_credentials') */
  code: string;
  /** i18n interpolation params (e.g., { field: 'email', min: 8 }) */
  params?: Record<string, string | number | boolean>;
  /** Optional field path for form validation errors (e.g., 'email', 'password') */
  field?: string;
}

// ─── Response Types ────────────────────────────────────────────────────────────

/** Pagination metadata */
export interface ApiPaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** Response metadata */
export interface ApiMeta {
  /** Request timestamp */
  timestamp: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Pagination info */
  pagination?: ApiPaginationMeta;
}

/**
 * Standard API Response wrapper.
 *
 * @example Success:
 * { status: 200, data: { user: {...} } }
 *
 * @example Validation Error:
 * { status: 422, data: null, errors: [
 *   { code: 'errors.validation.required', params: { field: 'email' }, field: 'email' },
 *   { code: 'errors.validation.min_length', params: { field: 'password', min: 8 }, field: 'password' }
 * ]}
 *
 * @example Auth Error:
 * { status: 401, data: null, errors: [
 *   { code: 'errors.auth.invalid_credentials' }
 * ]}
 */
export interface ApiResponse<T = unknown> {
  /** HTTP status code */
  status: number;
  /** Response payload (null on error) */
  data: T | null;
  /** Array of errors (only present on failure) */
  errors?: ApiError[];
  /** Response metadata */
  meta?: ApiMeta;
}

// ─── Helper Types ──────────────────────────────────────────────────────────────

/** Successful response shorthand */
export type ApiSuccessResponse<T> = ApiResponse<T> & {
  data: T;
  errors?: never;
};

/** Error response shorthand */
export type ApiErrorResponse = ApiResponse<null> & {
  data: null;
  errors: ApiError[];
};

// ─── Notification Schema ───────────────────────────────────────────────────────

/** Notification severity levels */
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

/**
 * Standard notification object.
 * Used by both push notifications and toast messages.
 * Backend can send these, frontend resolves i18n.
 */
export interface AppNotification {
  /** Unique notification ID */
  id: string;
  /** i18n key for the title (e.g., 'notifications.update_available.title') */
  titleCode: string;
  /** i18n key for the message body */
  messageCode: string;
  /** i18n interpolation params */
  params?: Record<string, string | number | boolean>;
  /** Severity level */
  level: NotificationLevel;
  /** ISO timestamp */
  timestamp: string;
  /** Whether the user has read this notification */
  read: boolean;
}

// ─── Predefined Error Code Constants ───────────────────────────────────────────

/**
 * Standard error code constants.
 * These MUST match the i18n translation keys.
 *
 * Usage:
 * ```typescript
 * // Backend
 * return { status: 401, data: null, errors: [{ code: ERROR_CODES.AUTH.INVALID_CREDENTIALS }] };
 *
 * // Frontend i18n key resolution
 * t(error.code, error.params) → 'Email hoặc mật khẩu không đúng'
 * ```
 */
export const ERROR_CODES = {
  // Auth
  AUTH: {
    INVALID_CREDENTIALS: 'errors.auth.invalid_credentials',
    TOKEN_EXPIRED: 'errors.auth.token_expired',
    UNAUTHORIZED: 'errors.auth.unauthorized',
    FORBIDDEN: 'errors.auth.forbidden',
    ACCOUNT_LOCKED: 'errors.auth.account_locked',
    EMAIL_NOT_VERIFIED: 'errors.auth.email_not_verified',
    INVALID_RESET_TOKEN: 'errors.auth.invalid_reset_token',
  },
  // Validation
  VALIDATION: {
    REQUIRED: 'errors.validation.required',
    MIN_LENGTH: 'errors.validation.min_length',
    MAX_LENGTH: 'errors.validation.max_length',
    INVALID_EMAIL: 'errors.validation.invalid_email',
    INVALID_FORMAT: 'errors.validation.invalid_format',
    ALREADY_EXISTS: 'errors.validation.already_exists',
    NOT_FOUND: 'errors.validation.not_found',
    PASSWORDS_MISMATCH: 'errors.validation.passwords_mismatch',
  },
  // Server
  SERVER: {
    INTERNAL_ERROR: 'errors.server.internal_error',
    SERVICE_UNAVAILABLE: 'errors.server.service_unavailable',
    RATE_LIMIT: 'errors.server.rate_limit',
    MAINTENANCE: 'errors.server.maintenance',
  },
  // Resource
  RESOURCE: {
    NOT_FOUND: 'errors.resource.not_found',
    CONFLICT: 'errors.resource.conflict',
    GONE: 'errors.resource.gone',
  },
} as const;

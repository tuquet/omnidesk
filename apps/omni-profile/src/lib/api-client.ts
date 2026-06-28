import { createClient } from '@hey-api/client-fetch';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { authActions, authStore } from '@omnidesk/auth';
import type { ApiResponse, ApiError } from '@omnidesk/types';
import { ERROR_CODES } from '@omnidesk/types';

const client = createClient({});

// ─── Config ────────────────────────────────────────────────────────────────────

client.setConfig({
  baseUrl: 'http://localhost:1423', // Tauri Axum backend
  throwOnError: true,
});

// ─── Request Interceptor: Auto-attach Bearer Token ─────────────────────────────

client.interceptors.request.use((request: Request) => {
  const token = authStore.state.session?.access_token;

  if (token && request.headers) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }

  return request;
});

// ─── Error Resolution ──────────────────────────────────────────────────────────

/**
 * Show toast with copy option.
 */
function toastErrorWithCopy(message: string, description?: string) {
  const fullText = description ? `${message}\n${description}` : message;
  toast.error(message, {
    description,
    action: {
      label: i18n.t('common.copy', 'Copy'),
      onClick: () => {
        navigator.clipboard.writeText(fullText)
          .then(() => toast.success(i18n.t('common.copied', 'Copied to clipboard')))
          .catch(() => {});
      },
    },
  });
}

/**
 * Resolve a single ApiError to a localized message string.
 * Falls back to error.code if no translation found.
 */
function resolveErrorMessage(error: ApiError): string {
  const translated = i18n.t(error.code, error.params ?? {});
  // i18n.t returns the key itself if no translation found
  return translated !== error.code ? translated : error.code;
}

/**
 * Show toast(s) for an array of ApiErrors.
 * Groups field-level validation errors into a single toast.
 */
function showApiErrors(errors: ApiError[]) {
  const fieldErrors = errors.filter((e) => e.field);
  const generalErrors = errors.filter((e) => !e.field);

  // Show general errors as individual toasts
  for (const error of generalErrors) {
    toastErrorWithCopy(resolveErrorMessage(error));
  }

  // Group field-level validation errors into one toast
  if (fieldErrors.length > 0) {
    const messages = fieldErrors.map((e) => `• ${resolveErrorMessage(e)}`).join('\n');
    toastErrorWithCopy(i18n.t('errors.validation.title', 'Validation Error'), messages);
  }
}

// ─── Response Interceptor: Centralized Error Handling ──────────────────────────

client.interceptors.response.use(async (response: Response) => {
  if (response.ok) return response;

  // Try to parse response body as ApiResponse
  let body: ApiResponse | null = null;
  try {
    body = (await response.clone().json()) as unknown as ApiResponse;
  } catch {
    // Response body is not JSON
  }

  // If backend returned structured errors, resolve via i18n
  if (body?.errors && body.errors.length > 0) {
    showApiErrors(body.errors);

    // Special handling: 401 → auto logout
    if (body.status === 401) {
      const hasTokenExpired = body.errors.some((e) => e.code === ERROR_CODES.AUTH.TOKEN_EXPIRED);
      if (hasTokenExpired) {
        authActions.logout().catch(console.error);
        window.location.href = '/login';
      }
    }

    return response;
  }

  // Fallback: backend didn't return structured errors
  switch (response.status) {
    case 401:
      toastErrorWithCopy(i18n.t(ERROR_CODES.AUTH.UNAUTHORIZED));
      authActions.logout().catch(console.error);
      window.location.href = '/login';
      break;
    case 403:
      toastErrorWithCopy(i18n.t(ERROR_CODES.AUTH.FORBIDDEN));
      break;
    case 404:
      toastErrorWithCopy(i18n.t(ERROR_CODES.RESOURCE.NOT_FOUND));
      break;
    case 429:
      toastErrorWithCopy(i18n.t(ERROR_CODES.SERVER.RATE_LIMIT));
      break;
    case 503:
      toastErrorWithCopy(i18n.t(ERROR_CODES.SERVER.SERVICE_UNAVAILABLE));
      break;
    default:
      if (response.status >= 500) {
        const msg = `${response.status}: ${response.statusText}`;
        toastErrorWithCopy(i18n.t(ERROR_CODES.SERVER.INTERNAL_ERROR), msg);
        console.error(`API Error 500+: ${response.url} - ${msg}`);
      } else {
        toastErrorWithCopy(`${response.status}: ${response.statusText}`);
      }
  }

  return response;
});

export { client, resolveErrorMessage, showApiErrors, toastErrorWithCopy };

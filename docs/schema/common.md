# Common API Interfaces & DTOs

This document defines the standard response wrappers and common data structures used across all backend endpoints.

## 1. Standard API Response (`ApiResponse<T>`)

Every API response should be wrapped in a consistent envelope to make client-side parsing predictable.

```typescript
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  
  /** The actual payload. Null if an error occurred. */
  data: T | null;
  
  /** Error details, if success is false */
  error: ApiError | null;
  
  /** Meta information, commonly used for pagination */
  meta?: ApiMeta;
}
```

## 2. Standard Error Format (`ApiError`)

When `success` is `false`, the `error` object must provide context.

```typescript
export interface ApiError {
  /** Machine-readable error code (e.g., "VALIDATION_FAILED", "UNAUTHORIZED") */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Detailed field-level errors, useful for forms */
  details?: Record<string, string[]>;
  
  /** HTTP Status Code */
  status: number;
}
```

## 3. Pagination Meta (`ApiMeta`)

For endpoints that return lists/collections.

```typescript
export interface ApiMeta {
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    
    /** Number of items per page */
    limit: number;
    
    /** Total number of items across all pages */
    totalItems: number;
    
    /** Total number of pages */
    totalPages: number;
    
    /** Indicates if there is a next page */
    hasNextPage: boolean;
    
    /** Indicates if there is a previous page */
    hasPrevPage: boolean;
  }
}
```

## 4. Paginated Data Structure (`Paginated<T>`)

When returning a list, `data` will be an array of `T`, and `meta` will contain pagination info.

```typescript
// Example usage:
// Promise<ApiResponse<UserDTO[]>>
```

## 5. Common Date Fields

All entities will share standard audit timestamps. Dates are always stored and returned in **UTC+0** ISO 8601 format.

```typescript
export interface AuditableDTO {
  createdAt: string; // ISO 8601 string (UTC+0)
  updatedAt: string; // ISO 8601 string (UTC+0)
  deletedAt?: string | null; // For soft deletes (UTC+0)
}
```

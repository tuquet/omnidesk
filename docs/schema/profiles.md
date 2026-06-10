# Profile Interfaces & DTOs

Defines the structure for User Profiles. Note: Authentication credentials (passwords, social tokens) are handled strictly by Supabase Auth (`auth.users`). The `Profile` schema only holds public/application-level data.

*Note: The RBAC (Role-Based Access Control) package will extend this schema in a later phase.*

## 1. Profile DTO (`ProfileDTO`)

```typescript
export interface ProfileDTO {
  id: string; // Matches auth.users.id
  email: string; // Copied from auth.users for quick lookup
  
  fullName: string;
  avatarUrl?: string | null;
  
  // -- Phase 2: Supabase RBAC Packages Placeholder --
  // globalRole: 'SUPER_ADMIN' | 'USER';
  // permissions: string[];
  // ------------------------------------------------
  
  lastActiveAt?: string | null; // ISO 8601 string
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}
```

## 2. Update Profile DTO (`UpdateProfileDTO`)

Users can update their own public profile information.

```typescript
export interface UpdateProfileDTO {
  fullName?: string;
  avatarUrl?: string | null;
}
```

## 3. Minimal Profile DTO (`ProfileMinDTO`)

Used when returning a list of users attached to another entity (e.g., Task Assignee, Project Member) to reduce payload size.

```typescript
export interface ProfileMinDTO {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}
```

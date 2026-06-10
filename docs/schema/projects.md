# Project Interfaces & DTOs

Defines the structures for Projects and Project Memberships.

## 1. Project Enums

```typescript
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}
```

## 2. Project DTO (`ProjectDTO`)

The standard object returned when querying projects.

```typescript
export interface ProjectDTO {
  id: string; // UUID
  name: string;
  description?: string | null;
  status: ProjectStatus;
  
  /** The user who created the project */
  ownerId: string;
  
  /** Optional visual identifiers */
  colorCode?: string | null;
  icon?: string | null;
  
  /** Aggregated metrics (often computed dynamically) */
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
  };
  
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}
```

## 3. Project Member DTO (`ProjectMemberDTO`)

Represents a user's access level within a specific project.

```typescript
export interface ProjectMemberDTO {
  projectId: string;
  profileId: string;
  
  /** Embedded profile details for convenience */
  profile?: {
    fullName: string;
    avatarUrl?: string | null;
    email: string;
  };
  
  role: ProjectMemberRole;
  joinedAt: string; // ISO 8601 string
}
```

## 4. Create Project DTO (`CreateProjectDTO`)

```typescript
export interface CreateProjectDTO {
  name: string;
  description?: string;
  colorCode?: string;
  icon?: string;
}
```

## 5. Update Project DTO (`UpdateProjectDTO`)

```typescript
export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  colorCode?: string | null;
  icon?: string | null;
}
```

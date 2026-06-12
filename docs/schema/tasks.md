# Task Interfaces & DTOs

Defines the structure for Tasks (tickets, issues, to-dos) within a Project.

## 1. Task Enums

```typescript
export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  CHORE = 'CHORE',
  EPIC = 'EPIC',
}
```

## 2. Task DTO (`TaskDTO`)

The standard object returned when querying tasks.

```typescript
export interface TaskDTO {
  id: string; // UUID
  projectId: string; // UUID

  /** Automatically generated human-readable ID (e.g., "OmniDesk-101") */
  key: string;

  title: string;
  description?: string | null; // Supports markdown

  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;

  /** 0 to 100 representing completion percentage */
  progress: number;

  /** The user assigned to work on the task */
  assigneeId?: string | null;

  /** The user who created/reported the task */
  reporterId: string;

  dueDate?: string | null; // ISO 8601 string (Date only usually)

  /** Array of tag/label names */
  tags: string[];

  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}
```

## 3. Task Detailed DTO (`TaskDetailDTO`)

Extended version of TaskDTO that includes related entities (used when viewing a single task).

```typescript
export interface TaskDetailDTO extends TaskDTO {
  assignee?: ProfileMinDTO | null;
  reporter?: ProfileMinDTO;
  project?: {
    id: string;
    name: string;
  };
  /** Subtasks or checklist items could be included here */
  subtasks?: TaskMinDTO[];
}
```

## 4. Create Task DTO (`CreateTaskDTO`)

```typescript
export interface CreateTaskDTO {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus; // Defaults to BACKLOG
  priority?: TaskPriority; // Defaults to MEDIUM
  type?: TaskType; // Defaults to FEATURE
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}
```

## 5. Update Task DTO (`UpdateTaskDTO`)

All fields are optional.

```typescript
export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  progress?: number;
  assigneeId?: string | null;
  dueDate?: string | null;
  tags?: string[];
}
```

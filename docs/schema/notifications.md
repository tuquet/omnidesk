# Notification Interfaces & DTOs

Defines the structure for system and user-to-user notifications.

## 1. Notification Enums

```typescript
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  MENTION = 'MENTION',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  PROJECT_INVITE = 'PROJECT_INVITE'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
```

## 2. Notification DTO (`NotificationDTO`)

The standard object returned when querying notifications.

```typescript
export interface NotificationDTO {
  id: string; // UUID
  userId: string; // The recipient of the notification
  actorId?: string | null; // The user who triggered the notification (if applicable)
  type: NotificationType;
  priority: NotificationPriority;
  
  /** Short summary of the notification */
  title: string;
  
  /** Detailed content, could support simple markdown or HTML */
  message: string;
  
  /** Payload for navigation (e.g., { "projectId": "123", "taskId": "456" }) */
  actionPayload: Record<string, any>;
  
  /** Has the user seen/clicked this notification? */
  isRead: boolean;
  readAt?: string | null; // ISO 8601 string
  
  createdAt: string; // ISO 8601 string
}
```

## 3. Create Notification DTO (`CreateNotificationDTO`)

Used internally by the backend (or edge functions) to dispatch a new notification. Clients typically do not call this directly unless it's a peer-to-peer message.

```typescript
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionPayload?: Record<string, any>;
  priority?: NotificationPriority; // Defaults to NORMAL
}
```

## 4. Update Notification DTO (`UpdateNotificationDTO`)

Used primarily by the client to mark a notification as read.

```typescript
export interface UpdateNotificationDTO {
  isRead: boolean;
}
```

export const NOTIFICATION_TABLE = 'notifications';
export const NOTIFICATIONS_LIMIT = 20;

export type NotificationType = 'info' | 'warning' | 'success' | 'update';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_read: boolean;
  type: NotificationType;
  action_url?: string | null;
  user_id?: string;
}

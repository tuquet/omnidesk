import { Bell } from 'lucide-react';
import { Button } from '@kbm/ui';

export function NotificationButton() {
  // TODO: Integrate with real notification store (Zustand)
  const unreadCount = 0;

  return (
    <Button variant="outline" size="icon" className="relative">
      <Bell className="h-[1.2rem] w-[1.2rem]" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <span className="sr-only">Notifications</span>
    </Button>
  );
}

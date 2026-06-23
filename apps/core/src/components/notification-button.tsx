import { useState } from 'react';
import { Bell, Clock, Loader2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Badge,
} from '@omnidesk/ui';

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);

  const notifications: any[] = [];
  const unreadCount = 0;
  const isLoading = false;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px] p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-none"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <div className="h-[150px] flex items-center justify-center p-4 text-sm text-muted-foreground">
          No notifications.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

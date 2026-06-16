import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useNotifications } from '@omnidesk/app-notifications';
import type { AppNotification } from '@omnidesk/app-notifications';
import { Bell, Check, Clock, Info, AlertTriangle, Package, Loader2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Badge,
} from '@omnidesk/ui';

const typeIcon = {
  info: <Info className="h-4 w-4 text-muted-foreground" />,
  warning: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
  success: <Check className="h-4 w-4 text-muted-foreground" />,
  update: <Package className="h-4 w-4 text-muted-foreground" />,
};

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `Just now`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationButton() {
  const { notifications = [], markAllAsRead, markAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      setIsOpen(false);
      navigate({ to: notification.action_url });
    }
  };

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
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="h-[300px] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification, i) => (
                <div key={notification.id}>
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="mt-0.5">{typeIcon[notification.type]}</div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {notification.title}
                        </span>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                  {i < notifications.length - 1 && <DropdownMenuSeparator className="m-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

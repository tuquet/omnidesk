import { useState } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle, Package } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Badge,
} from '@kbm/ui';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'update';
}

const typeIcon = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  success: <Check className="h-4 w-4 text-green-500" />,
  update: <Package className="h-4 w-4 text-purple-500" />,
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to Kill Bug Machine',
    description: 'Get started by exploring the dashboard and component showcase.',
    time: '2m ago',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'New update available',
    description: 'Version 0.2.0 is ready to install with bug fixes and improvements.',
    time: '1h ago',
    read: false,
    type: 'update',
  },
  {
    id: '3',
    title: 'Build completed',
    description: 'Production build finished successfully in 12.4s.',
    time: '3h ago',
    read: true,
    type: 'success',
  },
  {
    id: '4',
    title: 'API rate limit warning',
    description: 'You have used 80% of your daily API quota.',
    time: '5h ago',
    read: true,
    type: 'warning',
  },
];

export function NotificationButton() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
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
              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-none">
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
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification, i) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start gap-3 p-3 text-sm transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="mt-0.5">{typeIcon[notification.type]}</div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {notification.time}
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

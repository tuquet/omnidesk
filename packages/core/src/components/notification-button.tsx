import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Badge, DropdownMenuLabel, DropdownMenuSeparator } from '@omnidesk/ui';;

export function NotificationButton({ triggerNode }: { triggerNode?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const [unreadCount] = useState(0);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {triggerNode ? (
          triggerNode
        ) : (
          <Button variant="outline" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="p-0">
          <div 
            className="flex items-center justify-between"
            style={{ padding: '8px 12px 6px 12px' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Notifications</span>
              {unreadCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-3.5 px-1 bg-primary/10 text-primary border-none"
                >
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div 
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: '120px', padding: '16px' }}
        >
          No notifications.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

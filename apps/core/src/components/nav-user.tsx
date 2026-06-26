import { Avatar, AvatarFallback, AvatarImage } from '@omnidesk/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@omnidesk/ui';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@omnidesk/ui';
import {
  EllipsisVerticalIcon,
  CircleUserRoundIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from 'lucide-react';
import { authActions } from '@omnidesk/app-auth';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const isGuest = !user.email;

  const handleLogout = () => {
    authActions.logout();
    toast.success('Đã đăng xuất');
    navigate({ to: '/login' });
  };

  const handleLogin = () => {
    navigate({ to: '/login' });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{isGuest ? 'G' : 'U'}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{isGuest ? 'Local Workspace' : user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{isGuest ? 'Offline Mode' : user.email}</span>
              </div>
              <EllipsisVerticalIcon className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{isGuest ? 'G' : 'U'}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{isGuest ? 'Local Workspace' : user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{isGuest ? 'Offline Mode' : user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!isGuest && (
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <CircleUserRoundIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCardIcon />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            <DropdownMenuSeparator />
            {isGuest ? (
              <DropdownMenuItem onClick={handleLogin} className="cursor-pointer text-primary">
                <CircleUserRoundIcon />
                Connect to Cloud
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

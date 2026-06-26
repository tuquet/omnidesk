import { Avatar, AvatarFallback, AvatarImage } from '@omnidesk/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from '@omnidesk/ui';
import {
  CircleUserRoundIcon,
  CreditCardIcon,
  LogOutIcon,
} from 'lucide-react';
import { authActions, useAuth } from '@omnidesk/app-auth';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export function HeaderUser() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  
  const isGuest = !user?.email;
  const name = displayName ?? 'User';
  const email = user?.email ?? '';
  const avatar = (user?.user_metadata?.avatar_url as string) ?? '';

  const handleLogout = () => {
    authActions.logout();
    toast.success('Đã đăng xuất');
    navigate({ to: '/login' });
  };

  const handleLogin = () => {
    navigate({ to: '/login' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9 shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <CircleUserRoundIcon className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="rounded-lg">{isGuest ? 'G' : 'U'}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{isGuest ? 'Local Workspace' : name}</span>
              <span className="truncate text-xs text-muted-foreground">{isGuest ? 'Offline Mode' : email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isGuest && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUserRoundIcon className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        {isGuest ? (
          <DropdownMenuItem onClick={handleLogin} className="cursor-pointer text-primary">
            <CircleUserRoundIcon className="mr-2 h-4 w-4" />
            Connect to Cloud
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

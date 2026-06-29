import { useState, useEffect } from 'react';
import { usePlatform } from '../providers/platform-provider';
import { Wifi, WifiOff } from 'lucide-react';
import { Button } from '@omnidesk/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@omnidesk/ui';

export function NetworkStatus() {
  const platformApi = usePlatform();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (platformApi.platform !== 'desktop') return;

    let isMounted = true;

    // Check with Rust for real internet connection (TCP ping)
    const checkRealNetwork = async () => {
      try {
        const result = (await platformApi.invoke('check_real_network')) as boolean;
        if (isMounted && result !== isOnline) {
          setIsOnline(result);
        }
      } catch (err) {
        // Fallback to JS navigator
        if (isMounted) setIsOnline(navigator.onLine);
      }
    };

    checkRealNetwork(); // initial check
    const interval = setInterval(checkRealNetwork, 10000); // Check every 10 seconds

    // Still listen to DOM events for immediate feedback
    const handleOnline = () => checkRealNetwork();
    const handleOffline = () => {
      if (isMounted) setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [platformApi, isOnline]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${isOnline ? 'text-green-500/80 hover:text-green-400' : 'text-destructive hover:text-destructive'}`}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isOnline ? 'Network Connected (Real)' : 'No Internet Connection'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

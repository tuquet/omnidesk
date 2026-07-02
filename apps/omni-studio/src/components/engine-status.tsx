import { useState, useEffect } from 'react';
import { ENGINE_API_URL } from '@omnidesk/core';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@omnidesk/ui';

export function EngineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkEngine = async () => {
      try {
        // Ping Engine runs API (since we know it exists)
        // A dedicated health endpoint is better, but this works for now
        const res = await fetch(`${ENGINE_API_URL}/api/engine/runs`, {
          method: 'GET',
          // Small timeout so it doesn't hang if Engine is down
          signal: AbortSignal.timeout(2000), 
        });
        
        if (isMounted) {
          setIsOnline(res.ok);
          setLastChecked(new Date());
        }
      } catch (err) {
        if (isMounted) {
          setIsOnline(false);
          setLastChecked(new Date());
        }
      }
    };

    // Check immediately
    checkEngine();
    
    // Check every 10 seconds
    const interval = setInterval(checkEngine, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1.5 w-full cursor-help opacity-80 hover:opacity-100 transition-opacity">
            <div className="relative flex h-2 w-2">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-green-500' : 'bg-destructive'}`}></span>
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate flex-1">
              Engine {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">
            {isOnline 
              ? `Connected to Omni Engine at ${ENGINE_API_URL}` 
              : `Cannot reach Omni Engine at ${ENGINE_API_URL}`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : '...'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { useState, useEffect } from 'react';
import { usePlatform } from '../providers/platform-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@omnidesk/ui';

export function AppVersion() {
  const platformApi = usePlatform();
  const [version, setVersion] = useState<string>('v1.0.0');

  useEffect(() => {
    if (platformApi.platform !== 'desktop') return;

    let isMounted = true;
    const fetchVersion = async () => {
      try {
        const v = (await platformApi.invoke('get_app_version')) as string;
        if (isMounted && v) {
          setVersion(`v${v}`);
        }
      } catch (e) {
        console.warn('Failed to fetch app version', e);
      }
    };
    fetchVersion();

    return () => {
      isMounted = false;
    };
  }, [platformApi]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="px-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
            {version}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Click to check for updates (Help {'>'} Check for Updates)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

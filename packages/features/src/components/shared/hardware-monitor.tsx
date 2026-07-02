import { useState, useEffect } from 'react';
import { usePlatform } from '@omnidesk/core';
import { Activity } from 'lucide-react';
import { Button } from '@omnidesk/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@omnidesk/ui';

interface HardwareUsage {
  cpu_percent: number;
  used_memory_kb: number;
  total_memory_kb: number;
}

export function HardwareMonitor() {
  const platformApi = usePlatform();
  const [usage, setUsage] = useState<HardwareUsage | null>(null);

  useEffect(() => {
    if (platformApi.platform !== 'desktop') return;

    let isMounted = true;

    const unlistenPromise = platformApi.listen(
      'hardware_usage_update',
      (payload: HardwareUsage) => {
        if (isMounted) setUsage(payload);
      },
    );

    // Optional: fetch initially to get data right away before the first event
    platformApi
      .invoke('get_hardware_usage')
      .then((res) => {
        if (isMounted) setUsage(res as HardwareUsage);
      })
      .catch((err) => console.error('Failed initial fetch', err));

    return () => {
      isMounted = false;
      unlistenPromise.then((unlisten) => {
        if (typeof unlisten === 'function') unlisten();
      });
    };
  }, [platformApi]);

  if (!usage) return null;

  const memUsedGb = (usage.used_memory_kb / 1024 / 1024).toFixed(1);
  const memTotalGb = (usage.total_memory_kb / 1024 / 1024).toFixed(1);
  const cpuPercent = usage.cpu_percent.toFixed(0);

  // Warn if RAM is above 85%
  const memRatio = usage.used_memory_kb / usage.total_memory_kb;
  const isHighMem = memRatio > 0.85;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 font-mono text-[10px] tracking-tight ${isHighMem ? 'text-destructive hover:text-destructive/80' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            <span>
              CPU: {cpuPercent}% | RAM: {memUsedGb} GB
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Total Memory: {memTotalGb} GB</p>
          <p>Memory Usage: {(memRatio * 100).toFixed(0)}%</p>
          {isHighMem ? (
            <p className="text-destructive mt-1 font-semibold">High Memory Usage!</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { useState, useEffect } from 'react';
import { usePlatform } from '../providers/platform-provider';
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

    const fetchHardware = async () => {
      try {
        const result = (await platformApi.invoke('get_hardware_usage')) as HardwareUsage;
        if (isMounted) setUsage(result);
      } catch (err) {
        console.error('Failed to fetch hardware usage', err);
      }
    };

    fetchHardware(); // initial fetch
    const interval = setInterval(fetchHardware, 3000); // refresh every 3 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
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
          {isHighMem && <p className="text-destructive mt-1 font-semibold">High Memory Usage!</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

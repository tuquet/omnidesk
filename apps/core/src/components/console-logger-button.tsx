import { useState } from 'react';
import { Bug, Copy, Trash2, XCircle, AlertTriangle, Info, Terminal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Badge,
} from '@omnidesk/ui';
import { useConsoleStore } from '@/stores/use-console-store';
import type { LogLevel } from '@/stores/use-console-store';
import { toast } from 'sonner';

const getLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'error':
      return <XCircle className="w-4 h-4 text-destructive" />;
    case 'warn':
      return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    case 'info':
      return <Info className="w-4 h-4 text-muted-foreground" />;
    default:
      return <Terminal className="w-4 h-4 text-muted-foreground" />;
  }
};

const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case 'error':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'warn':
      return 'bg-muted text-muted-foreground border-border';
    case 'info':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export function ConsoleLoggerButton() {
  const { logs, unreadCount, clearLogs, markAsRead } = useConsoleStore();
  const [isOpen, setIsOpen] = useState(false);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) markAsRead();
  };

  const copyToClipboard = () => {
    const text = logs
      .map(
        (l) => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`,
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Logs copied to clipboard!');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bug className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Console Logs</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">Console Logs</h4>
            <div className="flex gap-1">
              {errorCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1 bg-destructive/10 text-destructive border-none"
                >
                  {errorCount} Err
                </Badge>
              )}
              {warnCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {warnCount} Warn
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={copyToClipboard}
              title="Copy all logs"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={clearLogs}
              title="Clear logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="h-[300px] overflow-y-auto overflow-x-hidden">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              No logs captured.
            </div>
          ) : (
            <div className="flex flex-col">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 border-b text-xs last:border-0 ${log.level === 'error' ? 'bg-destructive/5' : ''}`}
                >
                  <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase px-1 h-3 font-mono rounded-sm ${getLevelColor(log.level)}`}
                      >
                        {log.level}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="font-mono whitespace-pre-wrap break-words text-foreground/90 leading-relaxed overflow-hidden">
                      {log.message}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

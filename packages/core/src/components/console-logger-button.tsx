import { useState } from 'react';
import { Bug, Copy, Trash2, XCircle, AlertTriangle, Info, Terminal } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Badge, DropdownMenuLabel, DropdownMenuSeparator } from '@omnidesk/ui';;
import { useConsoleStore } from '@omnidesk/core';
import type { LogLevel } from '@omnidesk/core';
import { toast } from 'sonner';

const getLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    case 'warn':
      return <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />;
    case 'info':
      return <Info className="w-3.5 h-3.5 text-muted-foreground" />;
    default:
      return <Terminal className="w-3.5 h-3.5 text-muted-foreground" />;
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

  const errorCount = logs.filter((l: { level?: string }) => l.level === 'error').length;
  const warnCount = logs.filter((l: { level?: string }) => l.level === 'warn').length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) markAsRead();
  };

  const copySingleLog = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('Log copied to clipboard!');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bug className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Console Logs</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="p-0">
          <div
            className="flex items-center justify-between"
            style={{ padding: '8px 12px 6px 12px' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Console Logs</span>
              <div className="flex gap-1">
                {errorCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-3.5 px-1 bg-destructive/10 text-destructive border-none"
                  >
                    {errorCount} Err
                  </Badge>
                )}
                {warnCount > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                    {warnCount} Warn
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={clearLogs}
              title="Clear logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div style={{ height: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
          {logs.length === 0 ? (
            <div
              className="flex items-center justify-center text-xs text-muted-foreground"
              style={{ height: '100%', padding: '16px' }}
            >
              No logs captured.
            </div>
          ) : (
            <div className="flex flex-col" style={{ padding: '4px' }}>
              {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className={`flex flex-col gap-1 rounded-md ${(log.level || 'info') === 'error' ? 'bg-destructive/5' : ''}`}
                    style={{ padding: '8px 10px', marginBottom: '4px' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getLevelIcon(log.level || 'info')}
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase px-1 h-3.5 font-mono rounded-sm ${getLevelColor(log.level || 'info')}`}
                        >
                          {log.level || 'info'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp || '').toLocaleTimeString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => copySingleLog(log.message || '')}
                          title="Copy log entry"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <pre className="font-mono whitespace-pre-wrap break-words text-foreground/90 leading-relaxed overflow-hidden bg-muted/30 p-1.5 rounded border border-border/50 mt-1">
                      {log.message || ''}
                    </pre>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

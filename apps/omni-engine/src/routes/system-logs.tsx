import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Button, Badge, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@omnidesk/ui';
import { TerminalIcon, SearchIcon, TrashIcon, DownloadIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

export const Route = createFileRoute('/system-logs')({
  component: SystemLogsPage,
});

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
}

// Initial mock data
const INITIAL_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Engine started on port 1423', source: 'omni_engine::core' },
  { id: '2', timestamp: new Date(Date.now() - 50000).toISOString(), level: 'INFO', message: 'Loaded 5 browser profiles', source: 'omni_engine::profiles' },
  { id: '3', timestamp: new Date(Date.now() - 40000).toISOString(), level: 'INFO', message: 'Scheduler initialized', source: 'omni_engine::scheduler' },
  { id: '4', timestamp: new Date(Date.now() - 30000).toISOString(), level: 'DEBUG', message: 'Checking for pending runs...', source: 'omni_engine::scheduler' },
  { id: '5', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'WARN', message: 'Cloud sync queue is empty', source: 'omni_engine::sync' },
];

function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt to listen to real tauri-plugin-log events if they are broadcasted
    // Note: tauri-plugin-log writes to file, but we can emit events from Rust if needed
    const unlisten = listen('log://log', (event: any) => {
      const payload = event.payload;
      if (payload) {
        setLogs(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          level: payload.level || 'INFO',
          message: payload.message || '',
          source: payload.target || 'system'
        }]);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'ERROR': return 'text-red-500';
      case 'WARN': return 'text-yellow-500';
      case 'DEBUG': return 'text-slate-500';
      default: return 'text-green-500';
    }
  };

  return (
    <PageContainer className="h-screen flex flex-col">
      <PageHeader>
        <PageTitle className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-primary" />
          System Logs
        </PageTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            <TrashIcon className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </PageHeader>

      <div className="bg-card rounded-md border shadow-sm flex-1 flex flex-col mb-4 overflow-hidden">
        <div className="p-2 border-b flex items-center gap-2 bg-muted/30">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter logs..." 
              className="pl-8 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#0d1117] text-[#c9d1d9] font-mono text-xs leading-relaxed space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground italic mt-4">
              No logs match your filters.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="flex gap-3 hover:bg-[#161b22] px-2 py-0.5 rounded">
                <span className="text-slate-500 shrink-0 w-24">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}
                </span>
                <span className={`shrink-0 w-12 font-bold ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-blue-400 shrink-0 w-32 truncate" title={log.source}>
                  [{log.source}]
                </span>
                <span className="break-words">
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </PageContainer>
  );
}

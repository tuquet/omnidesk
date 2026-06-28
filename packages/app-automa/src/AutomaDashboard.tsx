import { apiUrl } from './lib/api-config';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@omnidesk/ui';
import { Bug, Activity, ShieldCheck, PlayCircle, Clock, Terminal } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { createClient } from '@supabase/supabase-js';

// Determine if we are in Tauri context
const isTauri = !!(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__;

export default function AutomaDashboard() {
  const [workflows, setWorkflows] = useState<
    { id: string; name: string; [key: string]: unknown }[]
  >([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWorkflows();

    if (isTauri) {
      const unlisten = listen('e2e-log', (event: { payload: unknown }) => {
        setLogs((prev) => [...prev, event.payload as string]);
      });
      return () => {
        unlisten.then((f) => f());
      };
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom of logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchWorkflows = async () => {
    try {
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
      const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase.from('e2e_workflows').select('*');
      if (data) {
        setWorkflows(data);
      }
    } catch (e) {
      console.error('Failed to parse app data', e);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setLogs(['[System] Starting E2E Orchestrator via HTTP API...']);

    try {
      const token = localStorage.getItem('omnidesk_token') || '';
      const response = await fetch(apiUrl('/api/automa/run'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      // Note: The orchestrator runs async, so it doesn't block.
      // We rely on logs to see progress. (Note: Web clients currently don't receive Tauri events, SSE needed in future)
    } catch (e: unknown) {
      setLogs((prev) => [...prev, `[System] Error: ${e instanceof Error ? e.message : String(e)}`]);
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
      <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between space-y-2 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Automa Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor your End-to-End test executions and automated workflows.
            </p>
          </div>
          <Button onClick={runTests} disabled={isRunning} className="gap-2">
            <PlayCircle className="h-4 w-4" /> {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active in database</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Success Rate</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">--</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting first run</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-destructive/20 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Active Bugs</CardTitle>
              <Bug className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">0</div>
              <p className="text-xs text-muted-foreground mt-1 text-destructive/80">
                Captured during E2E tests
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Execution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0m</div>
              <p className="text-xs text-muted-foreground mt-1">Across all environments</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6 h-96">
          <Card className="col-span-3 shadow-sm flex flex-col h-full">
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Available E2E tests in the database.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {workflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workflows found.</p>
                ) : (
                  workflows.map((wf) => (
                    <div key={wf.id} className="flex items-center">
                      <span className="relative flex h-2 w-2 rounded-full bg-muted-foreground mr-4"></span>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{wf.name}</p>
                        <p className="text-xs text-muted-foreground">{wf.id}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4 shadow-sm flex flex-col h-full bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 bg-slate-900 pb-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <CardTitle className="text-sm font-mono font-normal">Orchestrator Logs</CardTitle>
                </div>
                {logs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-slate-400"
                    onClick={() => setLogs([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 font-mono text-xs overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">
                  No output yet. Click 'Run Tests' to start.
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={log.includes('ERROR:') ? 'text-red-400' : 'text-slate-300'}
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

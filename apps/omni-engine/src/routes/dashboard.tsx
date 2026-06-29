import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@omnidesk/ui';
import { Button } from '@omnidesk/ui';
import { Play, CalendarClock, Globe, Blocks, TerminalSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';

export const Route = createFileRoute('/dashboard')({
  component: CommandCenterPage,
});

function CommandCenterPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);

  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch Workflows from Omni Studio API
    fetch('http://localhost:1422/api/automa/workflows')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const workflowsData = data as { id: string; name: string }[];
          setWorkflows(workflowsData);
          if (workflowsData.length > 0) setSelectedWorkflow(workflowsData[0].id);
        }
      })
      .catch(console.error);

    // Fetch Profiles from Omni Profile API
    fetch('http://localhost:1423/api/browser-profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const profilesData = data as { id: string; name: string }[];
          setProfiles(profilesData);
          const initialSelection: Record<string, boolean> = {};
          profilesData.slice(0, 3).forEach((p) => {
            initialSelection[p.id] = true;
          });
          setSelectedProfiles(initialSelection);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let unlistenLog: UnlistenFn;

    listen<string>('e2e-log', (event) => {
      setLogs((l) => [...l, event.payload]);
    }).then((fn) => {
      unlistenLog = fn;
    });

    return () => {
      if (unlistenLog) unlistenLog();
    };
  }, []);

  const handleProfileToggle = (id: string) => {
    setSelectedProfiles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selectedProfiles).filter(Boolean).length;

  const handleRun = async () => {
    setIsRunning(true);
    setLogs(['[SYSTEM] Initializing orchestration sequence...']);

    const activeProfiles = profiles.filter((p) => selectedProfiles[p.id]);

    if (!selectedWorkflow) {
      setLogs((l) => [...l, '[SYSTEM] ERROR: No workflow selected.']);
      setIsRunning(false);
      return;
    }

    if (activeProfiles.length === 0) {
      setLogs((l) => [...l, '[SYSTEM] ERROR: No profiles selected.']);
      setIsRunning(false);
      return;
    }

    try {
      // 1. Ensure Automa Extension is unpacked
      await invoke('ensure_automa_extension');

      setLogs((l) => [...l, `[SYSTEM] Allocated ${activeProfiles.length} browser profile(s).`]);

      // 2. Launch profiles sequentially or in parallel
      for (const profile of activeProfiles) {
        setLogs((l) => [...l, `[SYSTEM] Requesting launch for Profile: ${profile.name}...`]);
        try {
          const res = await fetch(
            `http://localhost:1423/api/browser-profiles/${profile.id}/launch`,
            {
              method: 'POST',
            },
          );

          if (res.ok) {
            setLogs((l) => [...l, `[PROFILE ${profile.name}] Browser launched successfully.`]);
          } else {
            setLogs((l) => [...l, `[PROFILE ${profile.name}] ERROR: Failed to launch browser.`]);
          }
        } catch {
          setLogs((l) => [...l, `[PROFILE ${profile.name}] ERROR: API unreachable.`]);
        }
      }

      setLogs((l) => [...l, '[SYSTEM] Triggering workflow execution via WebSockets... (Pending)']);

      // Simulate workflow completion for now
      setTimeout(() => {
        setIsRunning(false);
        setLogs((l) => [...l, '[SYSTEM] Orchestration complete.']);
      }, 3000);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setLogs((l) => [...l, `[SYSTEM] ERROR: ${e.message}`]);
      } else {
        setLogs((l) => [...l, `[SYSTEM] ERROR: ${String(e)}`]);
      }
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-background">
      <div className="flex-none p-6 pb-4 border-b border-border/40 bg-card/50">
        <h1 className="text-3xl font-heading font-bold tracking-tight mb-1 text-foreground">
          Command Center
        </h1>
        <p className="text-muted-foreground text-sm">
          Place execution orders to run Workflows across multiple isolated browser Profiles.
        </p>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-6 p-6 min-h-0 overflow-hidden">
        {/* Left Form Panel - The "Order" Placement */}
        <div className="flex-none w-full lg:w-[480px] overflow-y-auto pr-2 space-y-6">
          <Card className="shadow-md border-border/60 bg-card">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" fill="currentColor" />
                Execution Order
              </CardTitle>
              <CardDescription>Select target workflow, environments, and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Blocks className="w-4 h-4 text-primary" /> 1. Select Workflow
                </label>
                <select
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  value={selectedWorkflow}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                >
                  <option value="" disabled>
                    -- Choose a Workflow --
                  </option>
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                  {workflows.length === 0 && <option disabled>Loading workflows...</option>}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Globe className="w-4 h-4 text-primary" /> 2. Target Profiles
                  </label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selectedCount} selected
                  </span>
                </div>
                <div className="border border-border/60 rounded-md p-1 space-y-1 max-h-48 overflow-y-auto bg-muted/10 shadow-inner">
                  {profiles.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">Loading profiles...</div>
                  )}
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={`p-${p.id}`}
                        className="rounded border-primary/50 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={!!selectedProfiles[p.id]}
                        onChange={() => handleProfileToggle(p.id)}
                      />
                      <label
                        htmlFor={`p-${p.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {p.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <CalendarClock className="w-4 h-4 text-primary" /> 3. Schedule Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="border-2 border-primary bg-primary/5 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-primary/10">
                    <input type="radio" name="schedule" className="sr-only" defaultChecked />
                    <Play className="w-6 h-6 mb-2 text-primary" fill="currentColor" />
                    <span className="text-sm font-bold text-primary">Run Now</span>
                  </label>
                  <label className="border-2 border-border/60 hover:border-primary/40 hover:bg-muted/50 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <input type="radio" name="schedule" className="sr-only" />
                    <CalendarClock className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Cron Job</span>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6 px-6">
              <Button
                onClick={handleRun}
                disabled={isRunning}
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg h-14 text-lg font-bold flex gap-2 items-center transition-all active:scale-[0.98]"
              >
                {isRunning ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
                    Executing Order...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" fill="currentColor" />
                    EXECUTE WORKFLOW
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Terminal Panel - Live Logs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex flex-col h-full bg-[#0D1117] border-border/40 shadow-xl overflow-hidden rounded-xl">
            <CardHeader className="bg-[#161B22] border-b border-border/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-mono text-gray-300 font-medium tracking-wide">
                  Engine_Terminal_Logs
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed">
              {!isRunning && logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                  <TerminalSquare className="w-16 h-16 opacity-50" strokeWidth={1} />
                  <p className="text-base">System standing by. Awaiting execution order.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-gray-300">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`
                      ${log.includes('INFO') ? 'text-blue-400' : ''}
                      ${log.includes('SYSTEM') ? 'text-purple-400 font-bold' : ''}
                      ${log.includes('PROFILE') ? 'text-emerald-400' : ''}
                      ${log.includes('ERROR') ? 'text-red-400' : ''}
                    `}
                    >
                      {log}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="text-blue-400 animate-pulse mt-2 block w-2 h-4 bg-blue-400"></div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

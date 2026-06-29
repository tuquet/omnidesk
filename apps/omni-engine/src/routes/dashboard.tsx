import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Tabs,
  TabsList,
  TabsTrigger,
  ScrollArea,
} from '@omnidesk/ui';
import { Play, CalendarClock, Globe, Blocks, TerminalSquare, Loader2 } from 'lucide-react';
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
          if (workflowsData.length > 0 && workflowsData[0])
            setSelectedWorkflow(workflowsData[0].id);
        }
      })
      .catch(console.error);

    // Fetch Profiles from Omni Profile API
    fetch('http://localhost:1421/api/browser-profiles')
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
            `http://localhost:1421/api/browser-profiles/${profile.id}/launch`,
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
                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="-- Choose a Workflow --" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Loading workflows...
                      </SelectItem>
                    ) : (
                      workflows.map((wf) => (
                        <SelectItem key={wf.id} value={wf.id}>
                          {wf.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Globe className="w-4 h-4 text-primary" /> 2. Target Profiles
                  </label>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {selectedCount} selected
                  </span>
                </div>
                <ScrollArea className="h-48 border border-border rounded-md bg-card shadow-inner">
                  <div className="p-2 space-y-1">
                    {profiles.length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Loading profiles...
                      </div>
                    )}
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group"
                        onClick={() => handleProfileToggle(p.id)}
                      >
                        <Checkbox
                          id={`p-${p.id}`}
                          checked={!!selectedProfiles[p.id]}
                          onCheckedChange={() => handleProfileToggle(p.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                        <label
                          htmlFor={`p-${p.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1 group-hover:text-primary transition-colors"
                          onClick={(e) => e.preventDefault()} // Prevent double trigger
                        >
                          {p.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <CalendarClock className="w-4 h-4 text-primary" /> 3. Schedule Type
                </label>
                <Tabs defaultValue="now" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                    <TabsTrigger
                      value="now"
                      className="flex flex-col gap-1 py-3 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                      <span className="text-xs font-bold">Run Now</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="cron"
                      className="flex flex-col gap-1 py-3 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      <CalendarClock className="w-5 h-5" />
                      <span className="text-xs font-medium">Cron Job</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6 px-6">
              <Button
                onClick={handleRun}
                disabled={isRunning}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-14 text-lg font-bold flex gap-2 items-center transition-all active:scale-[0.98]"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
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
          <Card className="flex flex-col h-full bg-zinc-950 border-border shadow-xl overflow-hidden rounded-xl">
            <CardHeader className="bg-zinc-900 border-b border-zinc-800 py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm font-mono text-zinc-300 font-medium tracking-wide">
                  Engine_Terminal_Logs
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed">
              {!isRunning && logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                  <TerminalSquare className="w-16 h-16 opacity-30" strokeWidth={1} />
                  <p className="text-base">System standing by. Awaiting execution order.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-zinc-300">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`
                      ${log.includes('INFO') ? 'text-cyan-400' : ''}
                      ${log.includes('SYSTEM') ? 'text-fuchsia-400 font-bold' : ''}
                      ${log.includes('PROFILE') ? 'text-emerald-400' : ''}
                      ${log.includes('ERROR') ? 'text-rose-400' : ''}
                    `}
                    >
                      {log}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="text-cyan-400 animate-pulse mt-2 block w-2 h-4 bg-cyan-400"></div>
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

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
import { Play, CalendarClock, Globe, Blocks, TerminalSquare, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/schedules')({
  component: OrchestratorPage,
});

function OrchestratorPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRun = () => {
    setIsRunning(true);
    setLogs(['[SYSTEM] Initializing orchestration sequence...']);

    setTimeout(
      () => setLogs((l) => [...l, '[SYSTEM] Allocated 3 browser profiles: 9021, 9022, 9023']),
      800,
    );
    setTimeout(() => setLogs((l) => [...l, '[PROFILE 9021] Browser launched successfully.']), 1500);
    setTimeout(() => setLogs((l) => [...l, '[PROFILE 9022] Browser launched successfully.']), 1800);
    setTimeout(
      () =>
        setLogs((l) => [
          ...l,
          '[PROFILE 9021] Automa extension active. Executing "Daily Scrape"...',
        ]),
      2200,
    );
    setTimeout(() => setLogs((l) => [...l, '[PROFILE 9023] Browser launched successfully.']), 2500);
    setTimeout(() => {
      setIsRunning(false);
      setLogs((l) => [...l, '[SYSTEM] Orchestration complete.']);
    }, 4000);
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <div className="flex-none p-6 pb-2">
        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Orchestrator</h1>
        <p className="text-muted-foreground text-sm">
          Schedule and execute automated workflows across multiple isolated browser profiles.
        </p>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-6 p-6 min-h-0 overflow-hidden">
        {/* Left Form Panel */}
        <div className="flex-none w-full lg:w-[450px] overflow-y-auto pr-2 space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Campaign Configuration</CardTitle>
              <CardDescription>Setup parameters for your execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Blocks className="w-4 h-4 text-primary" /> Target Workflow
                </label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>E-commerce Price Scraper</option>
                  <option>Social Media Auto-Poster</option>
                  <option>Daily Health Check</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Select Profiles
                </label>
                <div className="border border-border/60 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto bg-muted/20">
                  {[
                    'Profile 9021 (US-East)',
                    'Profile 9022 (UK-London)',
                    'Profile 9023 (SG-Asia)',
                    'Profile 9024 (US-West)',
                  ].map((p, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`p-${i}`}
                        className="rounded border-primary/50 text-primary focus:ring-primary h-4 w-4"
                        defaultChecked={i < 3}
                      />
                      <label
                        htmlFor={`p-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {p}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" /> Schedule Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="border border-primary bg-primary/5 rounded-md p-3 flex flex-col items-center justify-center cursor-pointer">
                    <input type="radio" name="schedule" className="sr-only" defaultChecked />
                    <Play className="w-5 h-5 mb-1 text-primary" />
                    <span className="text-sm font-medium text-primary">Run Now</span>
                  </label>
                  <label className="border border-border/60 hover:bg-muted/50 rounded-md p-3 flex flex-col items-center justify-center cursor-pointer">
                    <input type="radio" name="schedule" className="sr-only" />
                    <CalendarClock className="w-5 h-5 mb-1 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Cron Job</span>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                onClick={handleRun}
                disabled={isRunning}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm h-12 text-base font-bold flex gap-2 items-center"
              >
                {isRunning ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" fill="currentColor" />
                    RUN CAMPAIGN
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Terminal Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex flex-col h-full bg-[#0D1117] border-border/40 shadow-xl overflow-hidden rounded-xl">
            <CardHeader className="bg-[#161B22] border-b border-border/20 py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-mono text-gray-200">Execution Console</CardTitle>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-sm">
              {!isRunning && logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-3">
                  <TerminalSquare className="w-12 h-12" strokeWidth={1} />
                  <p>Ready to execute. Press Run Campaign.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 text-gray-300">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`
                      ${log.includes('INFO') ? 'text-blue-400' : ''}
                      ${log.includes('SYSTEM') ? 'text-purple-400 font-bold' : ''}
                      ${log.includes('PROFILE') ? 'text-emerald-400' : ''}
                    `}
                    >
                      {log}
                    </div>
                  ))}
                  {isRunning && <div className="text-blue-400 animate-pulse mt-1">_</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

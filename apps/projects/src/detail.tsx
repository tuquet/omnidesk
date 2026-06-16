import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from '@omnidesk/ui';
import { ChevronLeft, Terminal, RefreshCw, Trash } from 'lucide-react';
import { PROJECT_DATA, PROJECT_ACTIONS } from './config/constants';
import { useProjectRunner } from './hooks/use-project-runner';

export function ProjectDetailPage() {
  const { projectId } = useParams({ strict: false }) as any;
  const navigate = useNavigate();
  
  const project = projectId ? PROJECT_DATA[projectId] : null;
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const { logs, runState, runScript, stopScript, clearConsole } = useProjectRunner(
    project?.id ?? '',
  );

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button onClick={() => navigate({ to: '/app/$appId', params: { appId: 'projects' } as any })}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/app/$appId', params: { appId: 'projects' } as any })}
            className="-ml-3 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="default">{project.status}</Badge>
            <Badge variant="outline">WordPress Sync</Badge>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">{project.description}</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions Menu */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync Actions</CardTitle>
              <CardDescription>
                Trigger wp-sync-cli commands to manage WordPress content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROJECT_ACTIONS.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.script}
                    className="space-y-2 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{act.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">
                        {act.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={act.variant}
                      className="w-full justify-center gap-1.5 mt-1"
                      onClick={() => runScript(act.script)}
                      disabled={runState === 'running'}
                    >
                      {runState === 'running' ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                      Run {act.name}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Console Log Terminal */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-full min-h-[480px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-muted-foreground" />
                  Terminal Console
                </CardTitle>
                <CardDescription>Realtime command output log stream</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {runState === 'running' && (
                  <Badge
                    variant="default"
                    className="bg-amber-600 animate-pulse text-xs font-normal"
                  >
                    Running
                  </Badge>
                )}
                {runState === 'success' && (
                  <Badge variant="default" className="bg-green-600 text-xs font-normal">
                    Success
                  </Badge>
                )}
                {runState === 'error' && (
                  <Badge variant="default" className="bg-destructive text-xs font-normal">
                    Error
                  </Badge>
                )}
                {runState === 'idle' && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Idle
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearConsole}
                  disabled={logs.length === 0}
                >
                  <Trash className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
                {runState === 'running' && (
                  <Button size="sm" variant="destructive" onClick={stopScript}>
                    Stop
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 pt-0">
              <div className="flex-1 bg-zinc-950 text-zinc-100 font-mono text-xs p-4 rounded-lg overflow-y-auto max-h-[420px] min-h-[380px] border border-zinc-800 flex flex-col">
                {logs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 italic">
                    Console is empty. Run a sync action to view outputs.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => {
                      let colorClass = 'text-zinc-300';
                      if (log.startsWith('[System]')) {
                        colorClass = 'text-sky-400 font-bold';
                      } else if (log.startsWith('[System Error]') || log.startsWith('[stderr]')) {
                        colorClass = 'text-rose-400';
                      } else if (log.includes('successfully')) {
                        colorClass = 'text-emerald-400 font-bold';
                      }
                      return (
                        <div key={index} className={`whitespace-pre-wrap ${colorClass}`}>
                          {log}
                        </div>
                      );
                    })}
                    <div ref={terminalEndRef} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

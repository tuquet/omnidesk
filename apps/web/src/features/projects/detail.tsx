import { useState, useEffect, useRef } from 'react';
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
import {
  ChevronLeft,
  Terminal,
  RefreshCw,
  Upload,
  Download,
  Image,
  Search,
  Trash2,
  Trash,
} from 'lucide-react';

interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Planning' | 'On Hold' | 'Completed';
  tags: string[];
}

const PROJECT_DATA: Record<string, ProjectInfo> = {
  nhaatelier: {
    id: 'nhaatelier',
    name: 'Nha Atelier Tattoo Studio',
    description:
      'WordPress GitOps content sync application powered by wp-sync-cli, managing content and media library.',
    status: 'Active',
    tags: ['WordPress', 'GitOps', 'TypeScript', 'CLI'],
  },
};

type RunState = 'idle' | 'running' | 'success' | 'error';

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: '/_authenticated/projects_/$projectId' });
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [runState, setRunState] = useState<RunState>('idle');
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const project = projectId ? PROJECT_DATA[projectId] : null;

  useEffect(() => {
    return () => {
      // Clean up connection on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Auto scroll terminal to bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button onClick={() => navigate({ to: '/projects' })}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const runScript = (scriptName: string) => {
    if (runState === 'running') return;

    setRunState('running');
    setLogs([]);

    // API SSE Endpoint
    const url = `http://localhost:1421/api/projects/${project.id}/run-script/${scriptName}`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    source.onmessage = (event: MessageEvent) => {
      const data = event.data as string;
      setLogs((prev) => [...prev, data]);

      // Check if command execution finished
      if (data.includes('[System] Command finished successfully.')) {
        setRunState('success');
        source.close();
      } else if (
        data.includes('[System] Command exited with status:') ||
        data.includes('[System] Error waiting for process:')
      ) {
        setRunState('error');
        source.close();
      }
    };

    source.onerror = () => {
      setLogs((prev) => [...prev, '[System Error] Connection lost or server side script failed.']);
      setRunState('error');
      source.close();
    };
  };

  const clearConsole = () => {
    setLogs([]);
  };

  const stopScript = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setLogs((prev) => [...prev, '[System] Connection terminated by user.']);
      setRunState('idle');
    }
  };

  const actions = [
    {
      name: 'Pull Content',
      description: 'Pull content (Pages, Blocks, Menus) from WordPress to Local Markdown.',
      icon: Download,
      script: 'pull',
      variant: 'default' as const,
    },
    {
      name: 'Push Content',
      description: 'Push modified local Markdown pages and blocks back to WordPress site.',
      icon: Upload,
      script: 'push',
      variant: 'default' as const,
    },
    {
      name: 'Pull Media',
      description: 'Download WordPress media library catalog to local database (medias.json).',
      icon: Image,
      script: 'pull-media',
      variant: 'secondary' as const,
    },
    {
      name: 'Scan Media',
      description: 'Scan local Markdown content files to detect unused trash media files.',
      icon: Search,
      script: 'scan-media',
      variant: 'secondary' as const,
    },
    {
      name: 'Clean Media',
      description: 'Permantently delete all detected unused images from WordPress server.',
      icon: Trash2,
      script: 'clean-media',
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/projects' })}
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
              {actions.map((act) => {
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

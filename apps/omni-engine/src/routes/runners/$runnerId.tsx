import { createFileRoute, Link } from '@tanstack/react-router';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from '@omnidesk/ui';
import { TerminalSquare, ArrowLeft, Loader2, PlayCircle, Clock } from 'lucide-react';
import { useDashboardStore } from '../../stores/use-dashboard-store';
import { ROUTES } from '@/config/route-config';

export const Route = createFileRoute('/runners/$runnerId')({
  component: RunnerDetailPage,
});

function RunnerDetailPage() {
  const { runnerId } = Route.useParams();
  
  // In a real implementation, we would fetch the specific runner's details and logs.
  // For now, we mock the runner details and reuse the dashboard store's live logs.
  const { logs, isRunning } = useDashboardStore();

  const isCurrentRunner = isRunning; // Mock logic for demo purposes

  return (
    <PageContainer className="bg-background max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-80px)]">
      <PageHeader className="pb-6 flex-none">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10">
            <Link to={ROUTES.RUNNERS}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <PageTitle className="tracking-tight text-3xl font-bold">{runnerId}</PageTitle>
              {isCurrentRunner ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  <PlayCircle className="w-3.5 h-3.5 animate-pulse" />
                  Running
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                  Completed
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Workflow:</span> Daily Lead Scraping
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Targets:</span> 12 Profiles
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Started 10 mins ago
              </span>
            </div>
          </div>
        </div>
      </PageHeader>

      <Card className="flex-1 flex flex-col min-h-0 border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-muted/30 border-b flex-none">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TerminalSquare className="w-5 h-5 text-muted-foreground" />
            Automa Live Logs
          </CardTitle>
          {isCurrentRunner && (
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Streaming
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed p-6 bg-zinc-950 text-zinc-300">
          {!isCurrentRunner && logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
              <TerminalSquare className="w-16 h-16 opacity-30" strokeWidth={1} />
              <p className="text-base">No logs available for this runner.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
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
              {isCurrentRunner && (
                <div className="text-primary animate-pulse mt-2 flex items-center gap-2">
                  <span className="block w-2.5 h-5 bg-primary"></span>
                  <span className="text-xs text-muted-foreground font-sans">Awaiting next event...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

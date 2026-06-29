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
  PageContainer,
  PageHeader,
  PageTitle,
} from '@omnidesk/ui';
import { Play, CalendarClock, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useDashboardStore, dashboardActions } from '../stores/use-dashboard-store';

export const Route = createFileRoute('/')({
  component: SchedulerPage,
});

function SchedulerPage() {
  const { 
    isRunning, 
    workflows, 
    profiles, 
    selectedWorkflow, 
    selectedProfiles, 
    isLoading 
  } = useDashboardStore();

  useEffect(() => {
    dashboardActions.fetchInitialData();
  }, []);

  const selectedCount = Object.values(selectedProfiles).filter(Boolean).length;

  return (
    <PageContainer className="bg-background max-w-4xl mx-auto w-full">
      <PageHeader className="pb-8">
        <div>
          <PageTitle className="tracking-tight text-3xl font-bold">Job Scheduler</PageTitle>
          <div className="text-base text-muted-foreground mt-2">
            Create an execution order to run Workflows across multiple isolated browser Profiles.
          </div>
        </div>
      </PageHeader>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="text-xl">Execution Order</CardTitle>
          <CardDescription>Select target workflow, environments, and schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
              Select Workflow
            </label>
            <Select 
              value={selectedWorkflow || undefined} 
              onValueChange={dashboardActions.setSelectedWorkflow}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full bg-background h-12">
                <SelectValue placeholder="-- Choose a Workflow --" />
              </SelectTrigger>
              <SelectContent>
                {workflows.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    {isLoading ? "Loading workflows..." : "No workflows found"}
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                Target Profiles
              </label>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {selectedCount} selected
              </span>
            </div>
            <ScrollArea className="h-64 border rounded-md bg-muted/10">
              <div className="p-2 space-y-1">
                {profiles.length === 0 && (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    {isLoading ? "Loading profiles..." : "No profiles found"}
                  </div>
                )}
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center space-x-3 p-3 hover:bg-muted rounded-md transition-colors cursor-pointer group"
                    onClick={() => dashboardActions.toggleProfile(p.id)}
                  >
                    <Checkbox
                      id={`p-${p.id}`}
                      checked={!!selectedProfiles[p.id]}
                      onCheckedChange={() => dashboardActions.toggleProfile(p.id)}
                      className="data-[state=checked]:bg-primary h-5 w-5"
                    />
                    <label
                      htmlFor={`p-${p.id}`}
                      className="text-base font-medium leading-none cursor-pointer flex-1 group-hover:text-primary transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      {p.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
              Schedule Type
            </label>
            <Tabs defaultValue="now" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="now" className="flex items-center gap-2 text-base">
                  <Play className="w-5 h-5" />
                  Run Now
                </TabsTrigger>
                <TabsTrigger value="cron" className="flex items-center gap-2 text-base">
                  <CalendarClock className="w-5 h-5" />
                  Cron Job
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="pt-6 pb-6 border-t bg-muted/10">
          <Button
            size="lg"
            onClick={dashboardActions.runWorkflow}
            disabled={isRunning || isLoading || !selectedWorkflow || selectedCount === 0}
            className="w-full text-base font-bold h-14"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Executing Order...
              </>
            ) : (
              <>
                <Play className="mr-3 h-5 w-5" fill="currentColor" />
                EXECUTE WORKFLOW
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  );
}

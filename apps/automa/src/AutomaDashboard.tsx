import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@omnidesk/ui';
import { Bug, Activity, ShieldCheck, PlayCircle, Clock } from 'lucide-react';

export default function AutomaDashboard() {
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
          <Button className="gap-2">
            <PlayCircle className="h-4 w-4" /> Run Tests
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground mt-1">
                +3 from last week
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Success Rate</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">98.5%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on last 100 runs
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-destructive/20 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Active Bugs</CardTitle>
              <Bug className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">3</div>
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
              <div className="text-2xl font-bold">12h 45m</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all environments
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest test runs across your environments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex items-center">
                  <span className="relative flex h-2 w-2 rounded-full bg-green-500 mr-4"></span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Login Flow E2E</p>
                    <p className="text-sm text-muted-foreground">Passed in 45s</p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-muted-foreground">Just now</div>
                </div>
                <div className="flex items-center">
                  <span className="relative flex h-2 w-2 rounded-full bg-destructive mr-4"></span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-destructive">Checkout Process</p>
                    <p className="text-sm text-muted-foreground">Failed at payment step</p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-muted-foreground">2 hours ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Bug Capture Inbox</CardTitle>
              <CardDescription>Screenshots from failed executions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Bug className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground">No recent screenshots captured.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

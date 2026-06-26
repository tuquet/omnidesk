import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@omnidesk/ui';
import { Button } from '@omnidesk/ui';
import { Activity, Cloud, LayoutGrid, Bug, ArrowRight, ServerCrash } from 'lucide-react';

export function CommandCenterDashboard() {
  return (
    <div className="flex flex-1 flex-col h-full w-full bg-background overflow-y-auto">
      <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Command Center</h2>
            <p className="text-muted-foreground">
              Welcome back! Here is the overview of your OmniDesk workspace.
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Health Check Widget */}
          <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Check</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">100% Pass</div>
              <p className="text-xs text-muted-foreground mt-1">
                +20.1% from last month
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <Bug className="h-4 w-4" />
                <span>0 new errors reported</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View Logs
              </Button>
            </CardContent>
          </Card>

          {/* Cloud Workflows Widget */}
          <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cloud Workflows</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Active</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hosted on Supabase
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily CRM Sync</span>
                  <span className="text-green-500">Running</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto Test Checkout</span>
                  <span className="text-amber-500">Scheduled</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Manage Workflows
              </Button>
            </CardContent>
          </Card>

          {/* App Store / Modules Widget */}
          <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 Installed</div>
              <p className="text-xs text-muted-foreground mt-1">
                Micro-apps ready to use
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/50 border border-transparent hover:border-border cursor-pointer transition-colors">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                    <ServerCrash className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium">Automa E2E</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/50 border border-transparent hover:border-border cursor-pointer transition-colors">
                  <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium">CRM Portal</span>
                </div>
              </div>
              <Button className="w-full mt-4 gap-2">
                Explore App Store <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

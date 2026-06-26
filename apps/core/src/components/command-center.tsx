import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@omnidesk/ui';
import { Button } from '@omnidesk/ui';
import { PackageOpen, ArrowRight, Loader2, LayoutGrid } from 'lucide-react';
import { supabase } from '@omnidesk/app-auth';
import { useNavigate } from '@tanstack/react-router';

interface InstalledApp {
  user_id: string;
  app_id: string;
  marketplace_apps: {
    id: string;
    name: string;
    package_hash: string;
  };
}

export function CommandCenterDashboard() {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInstalledApps() {
      try {
        const { data, error } = await supabase
          .from('user_installed_apps')
          .select('user_id, app_id, marketplace_apps(id, name, package_hash)');

        if (error) {
          console.error('Error fetching installed apps:', error);
          return;
        }

        // Filter out any null relations just in case
        const validApps = (data || []).filter(item => item.marketplace_apps) as InstalledApp[];
        setApps(validApps);
      } catch (err) {
        console.error('Failed to load apps:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInstalledApps();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full w-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty State (No apps installed)
  if (apps.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full w-full bg-background p-8 text-center animate-in fade-in duration-500">
        <div className="mb-6 rounded-full bg-primary/10 p-6 ring-1 ring-primary/20">
          <PackageOpen className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Your Workspace is Empty</h2>
        <p className="text-muted-foreground max-w-md text-base leading-relaxed mb-8">
          Welcome to OmniDesk! It looks like you haven't installed any applications yet. 
          Visit the App Store to discover and install powerful tools for your workspace.
        </p>
        <Button size="lg" className="gap-2" onClick={() => navigate({ to: '/app/app-store' })}>
          Explore App Store <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Launchpad State (Grid of installed apps)
  return (
    <div className="flex flex-1 flex-col h-full w-full bg-background overflow-y-auto">
      <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between space-y-2 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Launchpad</h2>
            <p className="text-muted-foreground">
              Your unified workspace. Select an application to get started.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => navigate({ to: '/app/app-store' })}>
            <LayoutGrid className="h-4 w-4" /> App Store
          </Button>
        </div>
        
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {apps.map((installedApp) => {
            const app = installedApp.marketplace_apps;
            return (
              <Card 
                key={app.id} 
                className="group cursor-pointer border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border transition-all duration-300 shadow-none hover:shadow-sm"
                onClick={() => navigate({ to: `/app/${app.id}` })}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-1 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-105">
                    <PackageOpen className="h-8 w-8 text-primary/70 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm leading-none">{app.name}</h3>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Switch, Badge, FieldGroup, Field, FieldLabel, FieldDescription } from '@omnidesk/ui';
import { CloudIcon, RefreshCwIcon, SaveIcon, DatabaseIcon, AlertCircleIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePlatform } from '@omnidesk/core';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const platform = usePlatform();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock sync stats
  const [syncStats, setSyncStats] = useState({
    pendingItems: 12,
    lastSync: new Date(Date.now() - 1000 * 60 * 5).toLocaleString(),
    status: 'Idle', // 'Idle' | 'Syncing' | 'Error'
  });

  useEffect(() => {
    // Try to load from tauri store if running in tauri
    const loadSettings = async () => {
      try {
        const url = await platform.invoke<string>('plugin:store|get', { key: 'supabaseUrl' });
        const key = await platform.invoke<string>('plugin:store|get', { key: 'supabaseKey' });
        const enabled = await platform.invoke<boolean>('plugin:store|get', { key: 'isSyncEnabled' });
        
        if (url) setSupabaseUrl(url);
        if (key) setSupabaseKey(key);
        if (enabled !== undefined) setIsSyncEnabled(enabled);
      } catch (e) {
        // Mock fallback for browser
        setSupabaseUrl(localStorage.getItem('supabaseUrl') || '');
        setSupabaseKey(localStorage.getItem('supabaseKey') || '');
        setIsSyncEnabled(localStorage.getItem('isSyncEnabled') === 'true');
      }
    };
    loadSettings();
  }, [platform]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await platform.invoke('plugin:store|set', { key: 'supabaseUrl', value: supabaseUrl });
      await platform.invoke('plugin:store|set', { key: 'supabaseKey', value: supabaseKey });
      await platform.invoke('plugin:store|set', { key: 'isSyncEnabled', value: isSyncEnabled });
      await platform.invoke('plugin:store|save');
    } catch (e) {
      // Mock fallback
      localStorage.setItem('supabaseUrl', supabaseUrl);
      localStorage.setItem('supabaseKey', supabaseKey);
      localStorage.setItem('isSyncEnabled', isSyncEnabled.toString());
    }
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully');
    }, 600);
  };

  const handleManualSync = () => {
    setSyncStats((prev) => ({ ...prev, status: 'Syncing' }));
    setTimeout(() => {
      setSyncStats({
        pendingItems: 0,
        lastSync: new Date().toLocaleString(),
        status: 'Idle',
      });
      toast.success('Sync completed successfully');
    }, 2000);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Engine Settings</PageTitle>
      </PageHeader>
      
      <div className="max-w-4xl flex flex-col gap-6">
        <Card>
          <CardHeader className="p-3 border-b">
            <div className="flex items-center gap-2">
              <CloudIcon className="w-5 h-5 text-primary" />
              <CardTitle>Cloud Sync (Supabase)</CardTitle>
            </div>
            <CardDescription>
              Configure connection to Supabase for cloud synchronization. Omni Engine will act as the background worker pushing local SQLite data to Postgres.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <FieldGroup>
              <Field orientation="horizontal" className="p-3 bg-muted/50 rounded-lg border flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel className="text-base">Enable Background Sync</FieldLabel>
                  <FieldDescription>Automatically sync changes every 30 seconds.</FieldDescription>
                </div>
                <Switch checked={isSyncEnabled} onCheckedChange={setIsSyncEnabled} />
              </Field>

              <Field>
                <FieldLabel>Supabase Project URL</FieldLabel>
                <Input 
                  placeholder="https://xxxxxx.supabase.co" 
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="h-8 text-sm"
                />
              </Field>
              
              <Field>
                <FieldLabel>Supabase Service Role Key</FieldLabel>
                <Input 
                  type="password" 
                  placeholder="eyJh..." 
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="h-8 text-sm"
                />
                <FieldDescription className="flex items-center gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  Required for Engine to bypass RLS policies during background sync operations.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-3">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
              Save Configuration
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="p-3 border-b">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5 text-primary" />
              <CardTitle>Sync Queue Status</CardTitle>
            </div>
            <CardDescription>Monitor the background sync queue</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-muted p-3 rounded-lg border flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Pending Items</span>
                <span className="text-xl font-semibold">{syncStats.pendingItems}</span>
              </div>
              <div className="bg-muted p-3 rounded-lg border flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-base font-semibold truncate">{syncStats.lastSync}</span>
              </div>
              <div className="bg-muted p-3 rounded-lg border flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Worker Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={syncStats.status === 'Syncing' ? 'default' : 'secondary'} className={syncStats.status === 'Syncing' ? 'bg-amber-500' : ''}>
                    {syncStats.status}
                  </Badge>
                  {syncStats.status === 'Syncing' && <RefreshCwIcon className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-3">
            <Button size="sm" variant="outline" onClick={handleManualSync} disabled={syncStats.status === 'Syncing' || !supabaseUrl}>
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${syncStats.status === 'Syncing' ? 'animate-spin' : ''}`} />
              Force Sync Now
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="p-3 border-b">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5 text-primary" />
              <CardTitle>Hardware & Runtime</CardTitle>
            </div>
            <CardDescription>Configure execution limits and polling settings for the Engine</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <FieldGroup>
              <Field>
                <FieldLabel>Max Concurrent Runs</FieldLabel>
                <Input 
                  type="number"
                  placeholder="5" 
                  defaultValue={5}
                  min={1}
                  max={20}
                  className="h-8 text-sm"
                />
                <FieldDescription>
                  Maximum number of browser instances running at the same time. Higher values consume more RAM.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>DB Polling Interval (seconds)</FieldLabel>
                <Input 
                  type="number"
                  placeholder="10" 
                  defaultValue={10}
                  min={5}
                  max={60}
                  className="h-8 text-sm"
                />
                <FieldDescription>
                  How often the Engine checks the database for scheduled jobs.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}


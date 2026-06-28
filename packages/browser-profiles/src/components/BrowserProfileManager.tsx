import React, { useEffect, useState } from 'react';
import { useBrowserProfileStore, type BrowserProfile } from '../stores/use-browser-profile-store';
import { listen } from '@tauri-apps/api/event';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@omnidesk/ui';
import { Button } from '@omnidesk/ui';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@omnidesk/ui';
import { Input } from '@omnidesk/ui';
import { Label } from '@omnidesk/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@omnidesk/ui';
import { toast } from 'sonner';
import { Trash2, Edit, Play } from 'lucide-react';
import { usePlatform } from '@omnidesk/core';

export function BrowserProfileManager() {
  const { profiles, isLoading, fetchProfiles, deleteProfile, launchProfile } = useBrowserProfileStore();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ status: string; percentage: number | null } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    // Log for debugging
    console.log('[BrowserProfileManager] Registering listener for browser-download-progress');

    listen('browser-download-progress', (event: any) => {
      console.log('[BrowserProfileManager] Received progress via IPC:', event.payload);
      setDownloadProgress(event.payload);
      if (event.payload.status === 'done') {
        setTimeout(() => setDownloadProgress(null), 3000);
      }
    }).then((fn) => {
      unlisten = fn;
    }).catch(err => {
      console.error('[BrowserProfileManager] Failed to listen:', err);
    });

    // Fallback: HTTP Polling (Universal for both Web and Tauri)
    const interval = setInterval(async () => {
      try {
        const { PROFILE_API_URL } = await import('@omnidesk/core');
        const res = await fetch(`${PROFILE_API_URL}/api/browser-profiles/download-status`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.status) {
            console.log('[BrowserProfileManager] Received progress via HTTP:', data);
            setDownloadProgress(data);
            if (data.status === 'done') {
              setTimeout(() => setDownloadProgress(null), 3000);
            }
          }
        }
      } catch (e) {
        // silently ignore network errors during polling
      }
    }, 1000);

    return () => {
      if (unlisten) unlisten();
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      try {
        await deleteProfile(id);
        toast.success('Profile deleted successfully');
      } catch (e: any) {
        toast.error('Failed to delete profile');
      }
    }
  };

  const handleLaunch = async (profileId: string) => {
    toast.info('Launching profile...');
    try {
      await launchProfile(profileId);
      toast.success('Browser launched successfully');
    } catch (e: any) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Browser Profiles</h1>
          <p className="text-muted-foreground">
            Manage your local browser profiles for E2E testing and automation.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            if (confirm('Are you sure you want to delete the browser engine? This will force a redownload on the next launch.')) {
              try {
                const { resetBrowserEngine } = await import('../stores/use-browser-profile-store').then(m => m.useBrowserProfileStore.getState());
                await resetBrowserEngine();
                toast.success('Browser engine deleted. Click Play on any profile to download again.');
              } catch(e) {
                toast.error('Failed to reset browser engine');
              }
            }
          }}>
            Reset Browser
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Profile</DialogTitle>
              </DialogHeader>
              <CreateProfileForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {downloadProgress && (
        <div className="bg-primary/5 border rounded-lg p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="capitalize">
              {downloadProgress.status === 'downloading' ? 'Downloading Chromium...' : 
               downloadProgress.status === 'extracting' ? 'Extracting Browser...' : 'Ready!'}
            </span>
            <span>{downloadProgress.percentage ? Math.round(downloadProgress.percentage) : 0}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${downloadProgress.percentage || 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Proxy</TableHead>
              <TableHead>Data Dir</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No profiles found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile: BrowserProfile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell className="capitalize">{profile.browser_type}</TableCell>
                  <TableCell>{profile.proxy || 'None'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]" title={profile.data_dir_path}>
                    {profile.data_dir_path}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleLaunch(profile.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreateProfileForm({ onSuccess }: { onSuccess: () => void }) {
  const { createProfile } = useBrowserProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    browser_type: 'chrome',
    executable_path: null,
    proxy: null,
    user_agent: null,
    fingerprint_config: null,
    data_dir_path: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real scenario, we'd auto-generate data_dir_path if empty based on the app's appData path
      let payload = { ...formData };
      if (!payload.data_dir_path) {
        // Fallback for MVP
        payload.data_dir_path = `profiles/${payload.name.replace(/\s+/g, '_').toLowerCase()}`;
      }

      await createProfile(payload);
      toast.success('Profile created successfully');
      onSuccess();
    } catch (e: any) {
      toast.error('Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Profile Name</Label>
        <Input 
          id="name" 
          placeholder="e.g. Test Profile 1" 
          required 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="browser_type">Browser</Label>
        <Select 
          value={formData.browser_type} 
          onValueChange={(val) => setFormData({...formData, browser_type: val})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select browser" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chrome">Google Chrome</SelectItem>
            <SelectItem value="edge">Microsoft Edge</SelectItem>
            <SelectItem value="firefox">Mozilla Firefox</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="proxy">Proxy (Optional)</Label>
        <Input 
          id="proxy" 
          placeholder="http://user:pass@ip:port" 
          value={formData.proxy || ''}
          onChange={(e) => setFormData({...formData, proxy: e.target.value || null})}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="user_agent">Custom User Agent (Optional)</Label>
        <Input 
          id="user_agent" 
          placeholder="Mozilla/5.0..." 
          value={formData.user_agent || ''}
          onChange={(e) => setFormData({...formData, user_agent: e.target.value || null})}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Creating...' : 'Create Profile'}
      </Button>
    </form>
  );
}

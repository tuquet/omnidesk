import { createFileRoute } from '@tanstack/react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@omnidesk/ui';
import { PageContainer, PageHeader, PageTitle, PageDescription, Button, Badge } from '@omnidesk/ui';
import { PlayIcon, EditIcon, TrashIcon, TagIcon, ShieldIcon, SearchIcon, DownloadIcon, SquareIcon } from 'lucide-react';
import { Input } from '@omnidesk/ui';
import { useEffect, useState } from 'react';
import { useBrowserProfileStore, type BrowserProfile } from '@omnidesk/browser-profiles';
import { toast } from 'sonner';
import { ProfileFormDialog } from '../components/profile-form-dialog';
import { API_BASE_URL } from '@omnidesk/core';

export const Route = createFileRoute('/browser-profiles')({
  component: BrowserProfilesPage,
});



function BrowserProfilesPage() {
  const {
    profiles, isLoading,
    fetchProfiles, launchProfile, stopProfile, deleteProfile,
  } = useBrowserProfileStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create'|'edit'>('create');
  const [selectedProfile, setSelectedProfile] = useState<BrowserProfile|null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ status: string; percentage: number | null } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null);
  
  // Compute unique tags from all profiles
  const allTags = Array.from(new Set(
    profiles.flatMap(p => {
      try {
        return p.tags ? JSON.parse(p.tags) : [];
      } catch {
        return [];
      }
    })
  )).sort();

  // Compute unique browsers
  const allBrowsers = Array.from(new Set(
    profiles.map(p => p.browser_type).filter(Boolean)
  )) as string[];

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    let match = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = 
        p.name.toLowerCase().includes(q) || 
        (!!p.notes && p.notes.toLowerCase().includes(q)) ||
        (!!p.browser_type && p.browser_type.toLowerCase().includes(q)) ||
        (!!p.os && p.os.toLowerCase().includes(q));
    }
    if (match && selectedTag) {
      try {
        const tags = p.tags ? JSON.parse(p.tags) : [];
        match = tags.includes(selectedTag);
      } catch {
        match = false;
      }
    }
    if (match && selectedBrowser) {
      match = p.browser_type === selectedBrowser;
    }
    return match;
  });

  useEffect(() => {
    fetchProfiles();

    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('profile-status-changed', (event) => {
        console.log('Profile status changed event received', event);
        fetchProfiles();
      }).then(u => {
        unlisten = u;
      });
    }).catch(e => {
      console.warn('Not in Tauri context, skipping event listener');
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Server-Sent Events for download progress
  useEffect(() => {
    let evtSource: EventSource | null = null;

    const initSSE = async () => {
      try {
        evtSource = new EventSource(`${API_BASE_URL}/api/browser-profiles/download-status`);

        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.status) {
              setDownloadProgress(prev => {
                if (prev?.status === 'done' && data.status === 'done') {
                  return prev;
                }
                return data;
              });
              
              if (data.status === 'done') {
                evtSource?.close();
                setTimeout(() => setDownloadProgress(null), 3000);
              }
            }
          } catch (e) {
            console.error('SSE parsing error', e);
          }
        };

        evtSource.onerror = () => {
          evtSource?.close();
          setDownloadProgress(null);
        };
      } catch (e) {
        console.error('Failed to init SSE', e);
      }
    };

    initSSE();

    return () => {
      if (evtSource) {
        evtSource.close();
      }
    };
  }, []);

  const handleCreate = () => {
    setFormMode('create');
    setSelectedProfile(null);
    setIsFormOpen(true);
  };

  const handleEdit = (profile: BrowserProfile) => {
    setFormMode('edit');
    setSelectedProfile(profile);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await deleteProfile(id);
        toast.success('Profile deleted');
      } catch(e) {
        toast.error('Failed to delete profile');
      }
    }
  };

  const handleLaunch = async (id: string) => {
    toast.info('Launching profile...');
    try {
      await launchProfile(id);
      toast.success('Browser launched successfully');
    } catch(e: any) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleStop = async (id: string) => {
    toast.info('Stopping profile...');
    try {
      await stopProfile(id);
      toast.success('Browser stopped successfully');
    } catch(e: any) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Browser Profiles</PageTitle>
            <PageDescription>Manage isolated browser environments and security configurations.</PageDescription>
          </div>
          <div className="flex gap-2">
            <Button data-testid="btn-create-profile" onClick={handleCreate}>
              Create Profile
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {downloadProgress && (
          <div className="bg-primary/5 border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between text-sm font-medium">
              <span className="capitalize">
                {downloadProgress.status === 'downloading' ? 'Downloading Chromium Engine...' : 
                 downloadProgress.status === 'extracting' ? 'Extracting Browser Engine...' : 'Ready!'}
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

        <div className="flex items-center gap-2 border p-2 rounded-lg bg-card text-card-foreground">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search profiles..." 
              className="pl-8 h-9" 
              data-testid="input-profile-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
              value={selectedBrowser || ''}
              onChange={e => setSelectedBrowser(e.target.value || null)}
            >
              <option value="">All Browsers</option>
              {allBrowsers.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedTag || ''}
              onChange={e => setSelectedTag(e.target.value || null)}
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <ShieldIcon className="h-4 w-4 mr-2" /> Proxy Type
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          <Table data-testid="table-profile-list">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Profile Name</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading profiles...</TableCell>
                </TableRow>
              ) : filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No profiles found matching your filters.</TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => {
                  let parsedTags: string[] = [];
                  try {
                    parsedTags = profile.tags ? JSON.parse(profile.tags) : [];
                  } catch (e) {}

                  return (
                    <TableRow key={profile.id} data-testid={`row-profile-${profile.id}`}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell className="capitalize">{profile.browser_type}</TableCell>
                      <TableCell>
                        {profile.status === 'RUNNING' || profile.pid ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">Running</Badge>
                        ) : (
                          <Badge variant="secondary">Stopped</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{profile.proxy || 'None'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {parsedTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {profile.status === 'RUNNING' || profile.pid ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10" data-testid={`btn-stop-profile-${profile.id}`} onClick={() => handleStop(profile.id)}>
                              <SquareIcon className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" data-testid={`btn-launch-profile-${profile.id}`} onClick={() => handleLaunch(profile.id)}>
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`btn-edit-profile-${profile.id}`} onClick={() => handleEdit(profile)}>
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`btn-delete-profile-${profile.id}`} onClick={() => handleDelete(profile.id)}>
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <ProfileFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        mode={formMode} 
        profile={selectedProfile} 
        onSuccess={fetchProfiles} 
      />
    </PageContainer>
  );
}

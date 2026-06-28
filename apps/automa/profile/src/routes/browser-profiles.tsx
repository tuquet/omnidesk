import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription, Button } from '@omnidesk/ui';
import { useState, useEffect } from 'react';
import { useBrowserProfileStore, type BrowserProfile } from '@omnidesk/browser-profiles';
import { toast } from 'sonner';
import { ProfileFormDialog } from '../components/profile-form-dialog';
import { useBrowserEvents } from '../hooks/use-browser-events';
import { useProfileFilters } from '../hooks/use-profile-filters';
import { ProfileToolbar } from '../components/profile-toolbar';
import { ProfileTable } from '../components/profile-table';

export const Route = createFileRoute('/browser-profiles')({
  component: BrowserProfilesPage,
});

function BrowserProfilesPage() {
  const { profiles, isLoading, fetchProfiles, launchProfile, stopProfile, deleteProfile } =
    useBrowserProfileStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProfile, setSelectedProfile] = useState<BrowserProfile | null>(null);

  const { downloadProgress } = useBrowserEvents();

  const filters = useProfileFilters(profiles);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

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
      } catch {
        toast.error('Failed to delete profile');
      }
    }
  };

  const handleLaunch = async (id: string) => {
    toast.info('Launching profile...');
    try {
      await launchProfile(id);
      toast.success('Browser launched successfully');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleStop = async (id: string) => {
    toast.info('Stopping profile...');
    try {
      await stopProfile(id);
      toast.success('Browser stopped successfully');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Browser Profiles</PageTitle>
            <PageDescription>
              Manage isolated browser environments and security configurations.
            </PageDescription>
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
                {downloadProgress.status === 'downloading'
                  ? 'Downloading Chromium Engine...'
                  : downloadProgress.status === 'extracting'
                    ? 'Extracting Browser Engine...'
                    : 'Ready!'}
              </span>
              <span>
                {downloadProgress.percent ? Math.round(Number(downloadProgress.percent)) : 0}%
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${downloadProgress.percent || 0}%` }}
              />
            </div>
          </div>
        )}

        <ProfileToolbar {...filters} />

        <ProfileTable
          profiles={filters.filteredProfiles}
          isLoading={isLoading}
          onLaunch={handleLaunch}
          onStop={handleStop}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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

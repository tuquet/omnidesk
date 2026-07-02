import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Button } from '@omnidesk/ui';
import { RunWorkflowModal } from '@omnidesk/features';;
import { useState, useEffect } from 'react';
import { useBrowserProfileStore } from '@omnidesk/browser-profiles';
import type { BrowserProfile } from '@omnidesk/types';
import { LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileFormDialog } from '../components/profile-form-dialog';
import { useBrowserEvents } from '../hooks/use-browser-events';
import { useProfileFilters } from '../hooks/use-profile-filters';
import { ProfileToolbar } from '../components/profile-toolbar';
import { ProfileTable } from '../components/profile-table';

export const Route = createFileRoute('/')({
  component: BrowserProfilesPage,
});

function BrowserProfilesPage() {
  const { profiles, isLoading, fetchProfiles, launchProfile, stopProfile, deleteProfile } =
    useBrowserProfileStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProfile, setSelectedProfile] = useState<BrowserProfile | null>(null);
  const [profileToRunWorkflow, setProfileToRunWorkflow] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { downloadProgress } = useBrowserEvents();

  const filters = useProfileFilters(profiles);

  useEffect(() => {
    fetchProfiles(sortBy, sortOrder);
  }, [fetchProfiles, sortBy, sortOrder]);

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
        // error shown by interceptor
      }
    }
  };

  const handleLaunch = async (id: string) => {
    try {
      await launchProfile(id);
    } catch {
      // error shown by interceptor
    }
  };

  const handleStop = async (id: string) => {
    try {
      await stopProfile(id);
    } catch {
      // error shown by interceptor
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle className="flex items-center gap-2 text-base md:text-lg">
          <LayoutGrid className="w-4 h-4 text-primary" />
          Browser Profiles
        </PageTitle>
        <div className="flex gap-2">
          <Button data-testid="btn-create-profile" size="sm" onClick={handleCreate}>
            Create Profile
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {downloadProgress && (
          <div className="bg-primary/5 border rounded-lg p-3 flex flex-col gap-2 shadow-sm">
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
          onRunWorkflow={setProfileToRunWorkflow}
          onCreate={handleCreate}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(newSortBy) => {
            if (sortBy === newSortBy) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(newSortBy);
              setSortOrder('desc');
            }
          }}
        />
      </div>

      <ProfileFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        profile={selectedProfile || undefined}
        onSuccess={fetchProfiles}
      />

      <RunWorkflowModal
        isOpen={!!profileToRunWorkflow}
        profileId={profileToRunWorkflow}
        onClose={() => setProfileToRunWorkflow(null)}
      />
    </PageContainer>
  );
}

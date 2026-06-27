import { createFileRoute } from '@tanstack/react-router';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@omnidesk/ui';
import { PageContainer, PageHeader, PageTitle, PageDescription, Button, Badge } from '@omnidesk/ui';
import { PlayIcon, EditIcon, MoreVerticalIcon, TagIcon, ShieldIcon } from 'lucide-react';

export const Route = createFileRoute('/browser-profiles')({
  component: BrowserProfilesPage,
});

function BrowserProfilesPage() {
  // Mock data for the UI representation
  const profiles = [
    { id: '1', name: 'Main FB Account', proxy: 'US-NY-1', status: 'stopped', tags: ['facebook', 'main'] },
    { id: '2', name: 'Google Ads 01', proxy: 'Direct', status: 'running', tags: ['google', 'ads'] },
    { id: '3', name: 'Crypto Airdrop', proxy: 'UK-LON-3', status: 'stopped', tags: ['crypto'] },
    { id: '4', name: 'Amazon Scraper', proxy: 'Rotating', status: 'stopped', tags: ['amazon'] },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Browser Profiles</PageTitle>
            <PageDescription>Manage isolated browser environments and fingerprints.</PageDescription>
          </div>
          <Button>Create Profile</Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {/* Filters bar placeholder */}
        <div className="flex items-center gap-2 border p-2 rounded-lg bg-card text-card-foreground">
          <Button variant="outline" size="sm" className="h-8"><TagIcon className="h-4 w-4 mr-2" /> Filter by Tag</Button>
          <Button variant="outline" size="sm" className="h-8"><ShieldIcon className="h-4 w-4 mr-2" /> Proxy Type</Button>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Profile Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell>
                    {profile.status === 'running' ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600">Running</Badge>
                    ) : (
                      <Badge variant="secondary">Stopped</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{profile.proxy}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {profile.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500"><PlayIcon className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><EditIcon className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVerticalIcon className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
}

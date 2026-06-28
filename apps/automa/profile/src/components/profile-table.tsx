import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from '@omnidesk/ui';
import { PlayIcon, EditIcon, TrashIcon, SquareIcon } from 'lucide-react';
import type { BrowserProfile } from '@omnidesk/browser-profiles';

interface ProfileTableProps {
  profiles: BrowserProfile[];
  isLoading: boolean;
  onLaunch: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (profile: BrowserProfile) => void;
  onDelete: (id: string) => void;
}

export function ProfileTable({
  profiles,
  isLoading,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
}: ProfileTableProps) {
  return (
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
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Loading profiles...
              </TableCell>
            </TableRow>
          ) : profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No profiles found matching your filters.
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((profile) => {
              let parsedTags: string[] = [];
              try {
                parsedTags = profile.tags ? (JSON.parse(profile.tags) as string[]) : [];
              } catch {
                // Ignore parse errors
              }

              return (
                <TableRow key={profile.id} data-testid={`row-profile-${profile.id}`}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell className="capitalize">{profile.browser_type}</TableCell>
                  <TableCell>
                    {profile.status === 'RUNNING' || profile.pid ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Running
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Stopped</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{profile.proxy || 'None'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {parsedTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {profile.status === 'RUNNING' || profile.pid ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          data-testid={`btn-stop-profile-${profile.id}`}
                          onClick={() => onStop(profile.id)}
                        >
                          <SquareIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          data-testid={`btn-launch-profile-${profile.id}`}
                          onClick={() => onLaunch(profile.id)}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid={`btn-edit-profile-${profile.id}`}
                        onClick={() => onEdit(profile)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-testid={`btn-delete-profile-${profile.id}`}
                        onClick={() => onDelete(profile.id)}
                      >
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
  );
}

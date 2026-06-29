import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@omnidesk/ui';
import {
  PlayIcon,
  EditIcon,
  TrashIcon,
  SquareIcon,
  GhostIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import type { BrowserProfile } from '@omnidesk/browser-profiles';
import { InlineTagEditor } from './inline-tag-editor';

interface ProfileTableProps {
  profiles: BrowserProfile[];
  isLoading: boolean;
  onLaunch: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (profile: BrowserProfile) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (column: string) => void;
}

export function ProfileTable({
  profiles,
  isLoading,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onCreate,
  sortBy,
  sortOrder,
  onSortChange,
}: ProfileTableProps) {
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDownIcon className="ml-1 h-3 w-3 opacity-30" />;
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDownIcon className="ml-1 h-3 w-3" />
    );
  };

  const handleSort = (column: string) => {
    onSortChange?.(column);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-md border bg-card shadow-sm">
        <Table data-testid="table-profile-list">
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[250px] cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">Profile Name {renderSortIcon('name')}</div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('browser_type')}
              >
                <div className="flex items-center">Browser {renderSortIcon('browser_type')}</div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">Status {renderSortIcon('status')}</div>
              </TableHead>
              <TableHead>Proxy</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('tags')}
              >
                <div className="flex items-center">Tags {renderSortIcon('tags')}</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // SKELETON LOADING STATE
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-1/2" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-1/3" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : profiles.length === 0 ? (
              // EMPTY STATE
              <TableRow>
                <TableCell colSpan={6} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 bg-muted/10">
                    <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/20 shadow-inner">
                      <GhostIcon className="h-8 w-8 text-primary/70" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">No profiles found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                      There are no browser profiles matching your current filters, or you haven't
                      created one yet.
                    </p>
                    <Button variant="outline" className="shadow-sm" onClick={onCreate}>
                      Create your first profile
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile, index) => {
                let parsedTags: string[] = [];
                try {
                  parsedTags = profile.tags ? (JSON.parse(profile.tags) as string[]) : [];
                } catch {
                  // Ignore parse errors
                }

                const isRunning = profile.status === 'RUNNING' || profile.pid;

                return (
                  <TableRow
                    key={profile.id}
                    data-testid={`row-profile-${profile.id}`}
                    className="group transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
                    style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                  >
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="capitalize">{profile.browser_type}</TableCell>
                    <TableCell>
                      {isRunning ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                        >
                          <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Running
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Stopped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {profile.proxy || 'None'}
                    </TableCell>
                    <TableCell>
                      <InlineTagEditor profile={profile} initialTags={parsedTags} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-100">
                        {isRunning ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-colors"
                                data-testid={`btn-stop-profile-${profile.id}`}
                                onClick={() => onStop(profile.id)}
                              >
                                <SquareIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Stop Profile</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors"
                                data-testid={`btn-launch-profile-${profile.id}`}
                                onClick={() => onLaunch(profile.id)}
                              >
                                <PlayIcon className="h-4 w-4 fill-current" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Launch Browser</TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 transition-colors"
                              data-testid={`btn-edit-profile-${profile.id}`}
                              onClick={() => onEdit(profile)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Profile</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                              data-testid={`btn-delete-profile-${profile.id}`}
                              onClick={() => onDelete(profile.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Profile</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

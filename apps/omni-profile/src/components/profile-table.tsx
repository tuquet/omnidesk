import type { BrowserProfile } from '@omnidesk/types';

import { useRef, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button, Skeleton, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@omnidesk/ui';;
import {
  PlayIcon,
  EditIcon,
  TrashIcon,
  SquareIcon,
  GhostIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  WorkflowIcon,
} from 'lucide-react';
import { InlineTagEditor } from './inline-tag-editor';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ProfileTableProps {
  profiles: BrowserProfile[];
  isLoading: boolean;
  onLaunch: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (profile: BrowserProfile) => void;
  onDelete: (id: string) => void;
  onRunWorkflow?: (id: string) => void;
  onCreate?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (column: string) => void;
}

const columnHelper = createColumnHelper<BrowserProfile>();

export function ProfileTable({
  profiles,
  isLoading,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onRunWorkflow,
  onCreate,
  sortBy,
  sortOrder,
  onSortChange,
}: ProfileTableProps) {
  const renderSortIcon = useCallback(
    (column: string) => {
      if (sortBy !== column)
        return <ArrowUpDownIcon className="ml-1 h-3 w-3 opacity-30 inline-block" />;
      return sortOrder === 'asc' ? (
        <ArrowUpIcon className="ml-1 h-3 w-3 inline-block" />
      ) : (
        <ArrowDownIcon className="ml-1 h-3 w-3 inline-block" />
      );
    },
    [sortBy, sortOrder],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => (
          <div className="flex items-center">Profile Name {renderSortIcon('name')}</div>
        ),
        cell: (info) => <div className="font-medium truncate">{info.getValue()}</div>,
        size: 250,
        enableResizing: true,
      }),
      columnHelper.accessor('browser_type', {
        header: () => (
          <div className="flex items-center">Browser {renderSortIcon('browser_type')}</div>
        ),
        cell: (info) => <div className="capitalize">{info.getValue()}</div>,
        size: 150,
        enableResizing: true,
      }),
      columnHelper.accessor('status', {
        header: () => <div className="flex items-center">Status {renderSortIcon('status')}</div>,
        cell: (info) => {
          const profile = info.row.original;
          const isRunning = profile.status === 'RUNNING' || profile.pid;
          return isRunning ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 whitespace-nowrap"
            >
              <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Running
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground whitespace-nowrap">
              Stopped
            </Badge>
          );
        },
        size: 120,
        enableResizing: true,
      }),
      columnHelper.accessor('last_used_at', {
        header: () => (
          <div className="flex items-center">Last Opened {renderSortIcon('last_used_at')}</div>
        ),
        cell: (info) => {
          const val = info.getValue();
          return (
            <div className="text-muted-foreground text-sm whitespace-nowrap">
              {val
                ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(val))
                : 'Never'}
            </div>
          );
        },
        size: 180,
        enableResizing: true,
      }),
      columnHelper.accessor('tags', {
        header: () => <div className="flex items-center">Tags</div>,
        cell: (info) => {
          const profile = info.row.original;
          let parsedTags: string[] = [];
          try {
            parsedTags = profile.tags ? (JSON.parse(profile.tags) as string[]) : [];
          } catch {
            // Ignore parse errors
          }
          return <InlineTagEditor profile={profile} initialTags={parsedTags} />;
        },
        size: 250,
        enableResizing: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right w-full">Actions</div>,
        cell: (info) => {
          const profile = info.row.original;
          const isRunning = profile.status === 'RUNNING' || profile.pid;
          return (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-100 min-w-[120px]">
              {isRunning ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-colors shrink-0"
                      data-testid={`btn-stop-profile-${profile.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStop(profile.id);
                      }}
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
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors shrink-0"
                      data-testid={`btn-launch-profile-${profile.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunch(profile.id);
                      }}
                    >
                      <PlayIcon className="h-4 w-4 fill-current" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Launch Browser</TooltipContent>
                </Tooltip>
              )}

              {onRunWorkflow && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors shrink-0"
                      data-testid={`btn-run-workflow-${profile.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunWorkflow(profile.id);
                      }}
                    >
                      <WorkflowIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Run Workflow</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-colors shrink-0"
                    data-testid={`btn-edit-profile-${profile.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(profile);
                    }}
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
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    data-testid={`btn-delete-profile-${profile.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(profile.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Profile</TooltipContent>
              </Tooltip>
            </div>
          );
        },
        size: 150,
        enableResizing: false,
      }),
    ],
    [onLaunch, onStop, onEdit, onDelete, onRunWorkflow, renderSortIcon],
  );

  const table = useReactTable({
    data: profiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: isLoading ? 0 : profiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53, // Estimated row height including border
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={parentRef}
        className="rounded-md border bg-card shadow-sm overflow-auto h-[calc(100vh-280px)] min-h-[400px] relative"
      >
        <Table
          data-testid="table-profile-list"
          style={{ width: table.getTotalSize(), minWidth: '100%', tableLayout: 'fixed' }}
        >
          <TableHeader className="sticky top-0 bg-card z-10 shadow-[0_1px_0_0_hsl(var(--border))]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={`relative whitespace-nowrap overflow-hidden ${
                      ['name', 'browser_type', 'status', 'last_used_at'].includes(header.column.id)
                        ? 'cursor-pointer hover:bg-muted/50 transition-colors'
                        : ''
                    }`}
                    onClick={() => {
                      if (
                        ['name', 'browser_type', 'status', 'last_used_at'].includes(
                          header.column.id,
                        )
                      ) {
                        onSortChange?.(header.column.id);
                      }
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}

                    {/* Resizer Handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/50 transition-colors ${
                          header.column.getIsResizing() ? 'bg-primary' : ''
                        }`}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // SKELETON LOADING STATE
              Array.from({ length: 10 }).map((_, i) => (
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
                    <Skeleton className="h-4 w-24" />
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
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-muted-foreground/20 rounded-xl m-2 bg-muted/10">
                    <div className="mb-2 rounded-full bg-primary/10 p-2 ring-1 ring-primary/20 shadow-inner">
                      <GhostIcon className="h-5 w-5 text-primary/70" />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight">No profiles found</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
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
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ height: `${paddingTop}px`, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  if (!row) return null;

                  return (
                    <TableRow
                      key={row.id}
                      data-testid={`row-profile-${row.original.id}`}
                      className="group transition-colors h-[53px]"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className="overflow-hidden"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ height: `${paddingBottom}px`, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

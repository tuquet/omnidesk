import { useRef, useMemo } from 'react';
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
  Checkbox,
} from '@omnidesk/ui';
import {
  PlayIcon,
  EditIcon,
  TrashIcon,
  WorkflowIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  is_disabled: number | null;
  updated_at: string | null;
};

interface WorkflowsTableProps {
  workflows: Workflow[];
  isLoading: boolean;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (column: string) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (updater: any) => void;
}

const columnHelper = createColumnHelper<Workflow>();

export function WorkflowsTable({
  workflows,
  isLoading,
  onEdit,
  onDelete,
  onRun,
  sortBy,
  sortOrder,
  onSortChange,
  rowSelection = {},
  onRowSelectionChange,
}: WorkflowsTableProps) {
  const renderSortIcon = (column: string) => {
    if (sortBy !== column)
      return <ArrowUpDownIcon className="ml-1 h-3 w-3 opacity-30 inline-block" />;
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="ml-1 h-3 w-3 inline-block" />
    ) : (
      <ArrowDownIcon className="ml-1 h-3 w-3 inline-block" />
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        size: 40,
        enableResizing: false,
      }),
      columnHelper.accessor('name', {
        header: () => (
          <div className="flex items-center">Workflow Name {renderSortIcon('name')}</div>
        ),
        cell: (info) => <div className="font-medium truncate">{info.getValue() || 'Untitled'}</div>,
        size: 250,
        enableResizing: true,
      }),
      columnHelper.accessor('id', {
        header: () => <div className="flex items-center">ID {renderSortIcon('id')}</div>,
        cell: (info) => <div className="text-muted-foreground truncate text-xs font-mono">{info.getValue()}</div>,
        size: 150,
        enableResizing: true,
      }),
      columnHelper.accessor('description', {
        header: () => <div className="flex items-center">Description {renderSortIcon('description')}</div>,
        cell: (info) => <div className="text-muted-foreground truncate">{info.getValue() || '-'}</div>,
        size: 300,
        enableResizing: true,
      }),
      columnHelper.accessor('is_disabled', {
        header: () => <div className="flex items-center">Status {renderSortIcon('is_disabled')}</div>,
        cell: (info) => {
          const isDisabled = info.getValue() === 1;
          return !isDisabled ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 whitespace-nowrap"
            >
              <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground whitespace-nowrap bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">
              Disabled
            </Badge>
          );
        },
        size: 120,
        enableResizing: true,
      }),
      columnHelper.accessor('updated_at', {
        header: () => (
          <div className="flex items-center">Last Updated {renderSortIcon('updated_at')}</div>
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
                : 'Unknown'}
            </div>
          );
        },
        size: 180,
        enableResizing: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right w-full">Actions</div>,
        cell: (info) => {
          const workflow = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-100 min-w-[120px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors shrink-0"
                    data-testid={`btn-run-workflow-${workflow.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRun(workflow.id);
                    }}
                  >
                    <PlayIcon className="h-4 w-4 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run Workflow</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-colors shrink-0"
                    data-testid={`btn-edit-workflow-${workflow.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(workflow);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Workflow</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    data-testid={`btn-delete-workflow-${workflow.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(workflow.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Workflow</TooltipContent>
              </Tooltip>
            </div>
          );
        },
        size: 150,
        enableResizing: false,
      }),
    ],
    [sortBy, sortOrder, onRun, onEdit, onDelete, renderSortIcon],
  );

  const table = useReactTable({
    data: workflows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    getRowId: (row) => row.id,
    state: {
      rowSelection,
    },
    onRowSelectionChange,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: isLoading ? 0 : workflows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53,
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
        className="rounded-md border bg-card shadow-sm overflow-auto flex-1 relative"
      >
        <Table
          data-testid="table-workflows-list"
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
                      ['name', 'description', 'is_disabled', 'updated_at'].includes(header.column.id)
                        ? 'cursor-pointer hover:bg-muted/50 transition-colors'
                        : ''
                    }`}
                    onClick={() => {
                      if (
                        ['name', 'description', 'is_disabled', 'updated_at'].includes(
                          header.column.id,
                        )
                      ) {
                        onSortChange?.(header.column.id);
                      }
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}

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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : workflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 bg-muted/10">
                    <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/20 shadow-inner">
                      <WorkflowIcon className="h-8 w-8 text-primary/70" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">No workflows found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                      There are no workflows in this workspace. Create one or sync from remote.
                    </p>
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
                      data-testid={`row-workflow-${row.original.id}`}
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

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type SortingState,
  type CellContext,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@omnidesk/ui';
import { Card } from '@omnidesk/ui';

import { type Bug, fetchBugs } from '../api/mock-bugs';

const VirtualBugRow = React.memo(function VirtualBugRow({
  row,
  virtualRow,
}: {
  row: Row<Bug>;
  virtualRow: VirtualItem;
}) {
  return (
    <TableRow
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualRow.start}px)`,
      }}
      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          style={{ width: cell.column.getSize() }}
          className="py-3 px-4"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
});

export function BugsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // 2. Fetch Data using React Query
  const { data: bugs = [], isLoading } = useQuery({
    queryKey: ['bugs-list'],
    queryFn: fetchBugs,
  });

  // 3. Define Table Columns
  const columns = React.useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        size: 100,
      },
      {
        header: 'Tiêu đề lỗi (Title)',
        accessorKey: 'title',
        size: 400,
      },
      {
        header: 'Trạng thái (Status)',
        accessorKey: 'status',
        size: 150,
        cell: (info: CellContext<Bug, string>) => {
          const val = info.getValue();
          return (
            <Badge variant="secondary" className="font-medium">
              {val}
            </Badge>
          );
        },
      },
      {
        header: 'Độ ưu tiên (Priority)',
        accessorKey: 'priority',
        size: 150,
      },
      {
        header: 'Ngày tạo (Date)',
        accessorKey: 'createdAt',
        size: 150,
      },
    ],
    [],
  );

  // 4. Setup React Table
  const table = useReactTable({
    data: bugs,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // 5. Setup React Virtual for Rows
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // approximate row height in px
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 animate-pulse">
        Đang tải hàng ngàn dữ liệu...
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-xl shadow-lg">
      {/* Scrollable Container */}
      <div
        ref={tableContainerRef}
        className="h-[600px] overflow-auto relative rounded-md custom-scrollbar"
      >
        <Table className="w-full text-left border-collapse">
          <TableHeader className="sticky top-0 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="cursor-pointer select-none py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              return (
                <VirtualBugRow
                  key={row.id}
                  row={row}
                  virtualRow={virtualRow}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

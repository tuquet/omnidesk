import { SearchIcon } from 'lucide-react';
import { Input, Button } from '@omnidesk/ui';

interface WorkflowsToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'active' | 'trash';
  setViewMode: (mode: 'active' | 'trash') => void;
}

export function WorkflowsToolbar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
}: WorkflowsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('active')}
          >
            Active
          </Button>
          <Button
            variant={viewMode === 'trash' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('trash')}
          >
            Trash
          </Button>
        </div>
        <div className="flex-1 w-full sm:w-auto relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filter workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/50 border-muted-foreground/20 hover:border-muted-foreground/30 focus-visible:ring-primary/30 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

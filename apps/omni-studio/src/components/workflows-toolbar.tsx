import { SearchIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { Input, Button } from '@omnidesk/ui';
import { useRef } from 'react';

interface WorkflowsToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'active' | 'trash';
  setViewMode: (mode: 'active' | 'trash') => void;
  onAdd?: () => void;
  onImport?: (fileContent: string) => void;
}

export function WorkflowsToolbar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onAdd,
  onImport,
}: WorkflowsToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onImport?.(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm w-full">
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
      <div className="flex items-center gap-2">
        {onImport && (
          <>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="font-medium bg-background hover:bg-muted">
              <UploadIcon className="mr-2 h-4 w-4" />
              Import Workflow
            </Button>
          </>
        )}
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="font-medium">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        )}
      </div>
    </div>
  );
}

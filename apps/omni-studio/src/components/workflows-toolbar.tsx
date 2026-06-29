import { SearchIcon, DownloadIcon, UploadCloudIcon } from 'lucide-react';
import { Input, Button } from '@omnidesk/ui';

interface WorkflowsToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onPull: () => void;
  onPush: () => void;
  isPulling: boolean;
  isPushing: boolean;
}

export function WorkflowsToolbar({
  searchQuery,
  setSearchQuery,
  onPull,
  onPush,
  isPulling,
  isPushing,
}: WorkflowsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex-1 w-full sm:w-auto relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Filter workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-background/50 border-muted-foreground/20 hover:border-muted-foreground/30 focus-visible:ring-primary/30 transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onPull}
          disabled={isPulling || isPushing}
        >
          <DownloadIcon className={`mr-2 h-4 w-4 ${isPulling ? 'animate-bounce' : ''}`} />
          Git Pull
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onPush}
          disabled={isPulling || isPushing}
        >
          <UploadCloudIcon className={`mr-2 h-4 w-4 ${isPushing ? 'animate-pulse' : ''}`} />
          Git Push
        </Button>
      </div>
    </div>
  );
}

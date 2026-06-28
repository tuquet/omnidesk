import { SearchIcon, ShieldIcon } from 'lucide-react';
import { Input, Button } from '@omnidesk/ui';

interface ProfileToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedBrowser: string | null;
  setSelectedBrowser: (b: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (t: string | null) => void;
  allBrowsers: string[];
  allTags: string[];
}

export function ProfileToolbar({
  searchQuery,
  setSearchQuery,
  selectedBrowser,
  setSelectedBrowser,
  selectedTag,
  setSelectedTag,
  allBrowsers,
  allTags,
}: ProfileToolbarProps) {
  return (
    <div className="flex items-center gap-2 border p-2 rounded-lg bg-card text-card-foreground">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search profiles..."
          className="pl-8 h-9"
          data-testid="input-profile-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="relative">
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
          value={selectedBrowser || ''}
          onChange={(e) => setSelectedBrowser(e.target.value || null)}
        >
          <option value="">All Browsers</option>
          {allBrowsers.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={selectedTag || ''}
          onChange={(e) => setSelectedTag(e.target.value || null)}
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      <Button variant="outline" size="sm" className="h-9">
        <ShieldIcon className="h-4 w-4 mr-2" /> Proxy Type
      </Button>
    </div>
  );
}

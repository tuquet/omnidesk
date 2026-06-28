import { SearchIcon, ShieldIcon, XIcon } from 'lucide-react';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@omnidesk/ui';

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
    <div className="flex items-center gap-3 border p-3 rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search profiles..."
          className="pl-9 pr-9 h-9"
          data-testid="input-profile-search"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedBrowser || 'all'}
          onValueChange={(val) => setSelectedBrowser(val === 'all' ? null : val)}
        >
          <SelectTrigger className="h-9 w-[150px] capitalize">
            <SelectValue placeholder="All Browsers" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Browsers</SelectItem>
            {allBrowsers.map((b) => (
              <SelectItem key={b} value={b} className="capitalize">
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedTag || 'all'}
          onValueChange={(val) => setSelectedTag(val === 'all' ? null : val)}
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1" />

      <Button variant="outline" size="sm" className="h-9 transition-colors">
        <ShieldIcon className="h-4 w-4 mr-2" /> Proxy Type
      </Button>
    </div>
  );
}

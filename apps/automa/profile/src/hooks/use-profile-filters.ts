import { useState, useMemo } from 'react';
import type { BrowserProfile } from '@omnidesk/browser-profiles';

export function useProfileFilters(profiles: BrowserProfile[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null);

  const allTags = useMemo(() => {
    return Array.from(
      new Set(
        profiles.flatMap((p) => {
          try {
            return p.tags ? (JSON.parse(p.tags) as string[]) : [];
          } catch {
            return [];
          }
        }),
      ),
    ).sort();
  }, [profiles]);

  const allBrowsers = useMemo(() => {
    return Array.from(new Set(profiles.map((p) => p.browser_type).filter(Boolean))) as string[];
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      let match = true;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        match =
          p.name.toLowerCase().includes(q) ||
          (!!p.notes && p.notes.toLowerCase().includes(q)) ||
          (!!p.browser_type && p.browser_type.toLowerCase().includes(q)) ||
          (!!p.os && p.os.toLowerCase().includes(q));
      }
      if (match && selectedTag) {
        try {
          const tags = p.tags ? (JSON.parse(p.tags) as string[]) : [];
          match = tags.includes(selectedTag);
        } catch {
          match = false;
        }
      }
      if (match && selectedBrowser) {
        match = p.browser_type === selectedBrowser;
      }
      return match;
    });
  }, [profiles, searchQuery, selectedTag, selectedBrowser]);

  return {
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedBrowser,
    setSelectedBrowser,
    allTags,
    allBrowsers,
    filteredProfiles,
  };
}

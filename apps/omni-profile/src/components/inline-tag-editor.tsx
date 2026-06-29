import { useState, useRef, useEffect } from 'react';
import { Badge, Button, Input } from '@omnidesk/ui';
import { PlusIcon } from 'lucide-react';
import { useBrowserProfileStore, type BrowserProfile } from '@omnidesk/browser-profiles';
import { toast } from 'sonner';

interface InlineTagEditorProps {
  profile: BrowserProfile;
  initialTags: string[];
}

export function InlineTagEditor({ profile, initialTags }: InlineTagEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState(initialTags.join(', '));
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateProfile } = useBrowserProfileStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const newTagsArray = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Check if changed
    if (JSON.stringify(newTagsArray) === JSON.stringify(initialTags)) {
      setIsEditing(false);
      return;
    }

    try {
      await updateProfile({
        id: profile.id,
        name: profile.name,
        data_dir_path: profile.data_dir_path,
        browser_type: profile.browser_type,
        browser_version: profile.browser_version,
        os: profile.os,
        notes: profile.notes,
        proxy: profile.proxy,
        status: profile.status,
        tags: JSON.stringify(newTagsArray),
      });
      toast.success('Tags updated');
    } catch (_e) {
      toast.error('Failed to update tags');
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          className="h-6 text-xs w-[150px]"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          onBlur={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="group relative flex gap-1.5 flex-wrap items-center min-h-[24px]">
      {initialTags.length > 0 ? (
        initialTags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs bg-muted/30 px-1.5 py-0">
            {tag}
          </Badge>
        ))
      ) : (
        <span className="text-muted-foreground text-xs italic">No tags</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-6"
        onClick={() => {
          setTagInput(initialTags.join(', '));
          setIsEditing(true);
        }}
      >
        <PlusIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

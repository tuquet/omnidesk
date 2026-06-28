import { useState, useEffect } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea, Separator,
} from '@omnidesk/ui';
import { Loader2Icon, SaveIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useBrowserProfileStore, type BrowserProfile } from '@omnidesk/browser-profiles';
import { ProxyConfig, type ProxyData } from './proxy-config';

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  profile?: BrowserProfile | null;
  onSuccess?: () => void;
}

const DEFAULT_PROXY: ProxyData = {
  enabled: false,
  type: 'HTTP',
  host: '',
  port: '',
  username: '',
  password: '',
};

export function ProfileFormDialog({ open, onOpenChange, mode, profile, onSuccess }: ProfileFormDialogProps) {
  const { createProfile, updateProfile, fetchAvailableVersions } = useBrowserProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [browserType, setBrowserType] = useState('chrome');
  const [browserVersion, setBrowserVersion] = useState('latest');
  const [os, setOs] = useState('win');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [proxy, setProxy] = useState<ProxyData>(DEFAULT_PROXY);
  const [executablePath, setExecutablePath] = useState('');

  const [availableVersions, setAvailableVersions] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableVersions(browserType).then(setAvailableVersions);
    setBrowserVersion('latest');
  }, [browserType]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && profile) {
      setName(profile.name);
      setBrowserType(profile.browser_type || 'chrome');
      setBrowserVersion((profile as any).browser_version || 'latest');
      setOs(profile.os || 'win');
      setNotes(profile.notes || '');
      setExecutablePath((profile as any).executable_path || '');
      try {
        const tags = JSON.parse(profile.tags || '[]');
        setTagsInput(Array.isArray(tags) ? tags.join(', ') : '');
      } catch {
        setTagsInput('');
      }
    } else {
      // Reset for create
      setName('');
      setBrowserType('chrome');
      setBrowserVersion('latest');
      setOs('win');
      setNotes('');
      setTagsInput('');
      setExecutablePath('');
      setProxy(DEFAULT_PROXY);
    }
  }, [mode, profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    setIsSubmitting(true);
    const tags = JSON.stringify(
      tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    );

    try {
      if (mode === 'create') {
        const dataDirPath = `profiles/${crypto.randomUUID()}`;
        await createProfile({
          name: name.trim(),
          browser_type: browserType,
          browser_version: browserVersion === 'latest' ? null : browserVersion,
          os,
          data_dir_path: dataDirPath,
          notes: notes || null,
          executable_path: executablePath || null,
          tags,
        } as any);
        toast.success('Profile created successfully');
      } else if (profile) {
        await updateProfile({
          id: profile.id,
          name: name.trim(),
          browser_type: browserType,
          browser_version: browserVersion === 'latest' ? null : browserVersion,
          os,
          data_dir_path: profile.data_dir_path,
          notes: notes || null,
          executable_path: executablePath || null,
          tags,
        } as any);
        toast.success('Profile updated successfully');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(mode === 'create' ? 'Failed to create profile' : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-6 sm:p-8 flex flex-col gap-0 sm:max-w-[540px] w-full">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">
            {mode === 'create' ? 'Create New Profile' : `Edit: ${profile?.name}`}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Fill out the form below to {mode === 'create' ? 'create a new' : 'edit the'} browser profile.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">
              Profile Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-name"
              placeholder="e.g., Main FB Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Browser + Version + OS */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Browser Engine</Label>
              <Select value={browserType} onValueChange={setBrowserType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chrome">Chromium (Built-in)</SelectItem>
                  <SelectItem value="edge">System Edge</SelectItem>
                  <SelectItem value="firefox">Firefox</SelectItem>
                  <SelectItem value="webkit">WebKit (Playwright)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version</Label>
              <Select value={browserVersion} onValueChange={setBrowserVersion}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  {availableVersions.map(v => (
                    <SelectItem key={v.version} value={v.version}>{v.version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</Label>
              <Select value={os} onValueChange={setOs}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Windows</SelectItem>
                  <SelectItem value="mac">macOS</SelectItem>
                  <SelectItem value="lin">Linux</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Executable Path */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Browser Executable Path (Optional)</Label>
            <Input
              placeholder="Leave empty to auto-download / use default"
              value={executablePath}
              onChange={(e) => setExecutablePath(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</Label>
            <Input
              placeholder="facebook, main, ads (comma-separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
            <Textarea
              className="min-h-[80px] resize-none"
              placeholder="Optional notes about this profile..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Separator />

          {/* Proxy */}
          <ProxyConfig proxy={proxy} onChange={setProxy} />

          <Separator />

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : mode === 'create' ? (
                <PlusIcon className="h-4 w-4 mr-2" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Create Profile' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

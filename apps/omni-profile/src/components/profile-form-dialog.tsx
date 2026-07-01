import type { BrowserProfile } from '@omnidesk/types';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Separator } from '@omnidesk/ui';
import { Loader2Icon, SaveIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useBrowserProfileStore } from '@omnidesk/browser-profiles';
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

const getDetectedOs = () => {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'win';
    if (ua.includes('mac')) return 'mac';
  }
  return 'lin';
};

export function ProfileFormDialog({
  open,
  onOpenChange,
  mode,
  profile,
  onSuccess,
}: ProfileFormDialogProps) {
  const { createProfile, updateProfile, fetchAvailableVersions } = useBrowserProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [browserType, setBrowserType] = useState('system-chrome');
  const [browserVersion, setBrowserVersion] = useState('latest');
  const [os, setOs] = useState(getDetectedOs());
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [proxy, setProxy] = useState<ProxyData>(DEFAULT_PROXY);
  const [executablePath, setExecutablePath] = useState('');

  const [availableVersions, setAvailableVersions] = useState<
    { browser_version: string; executable_path: string }[]
  >([]);

  useEffect(() => {
    fetchAvailableVersions(browserType).then((versions) => setAvailableVersions(versions));
    setBrowserVersion('latest');
  }, [browserType, fetchAvailableVersions]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && profile) {
      setName(profile.name);
      setBrowserType(profile.browser_type || 'system-chrome');
      setBrowserVersion(profile.browser_version || 'latest');
      setOs(profile.os || 'win');
      setNotes(profile.notes || '');
      setExecutablePath((profile as unknown as { executable_path: string }).executable_path || '');
      try {
        const tags = JSON.parse(profile.tags || '[]') as unknown;
        setTagsInput(Array.isArray(tags) ? tags.join(', ') : '');
      } catch {
        setTagsInput('');
      }
    } else {
      // Reset for create
      setName('');
      setBrowserType('system-chrome');
      setBrowserVersion('latest');
      setOs(getDetectedOs());
      setNotes('');
      setTagsInput('');
      setExecutablePath('');
      setProxy(DEFAULT_PROXY);
    }
  }, [mode, profile, open]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 3) {
      toast.error('Profile name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    const tags = JSON.stringify(
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
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
          tags,
        });
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
          tags,
        });
        toast.success('Profile updated successfully');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // error shown by interceptor
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
            Fill out the form below to {mode === 'create' ? 'create a new' : 'edit the'} browser
            profile.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 mt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">
              Profile Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-name"
              placeholder="e.g., Main FB Account"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              autoFocus
              required
              minLength={3}
            />
          </div>

          {/* Browser + Version + OS */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Browser Engine
              </Label>
              <Select value={browserType} onValueChange={setBrowserType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system-chrome">System Chrome</SelectItem>
                  <SelectItem value="chrome">Chromium (Portable CfT)</SelectItem>
                  <SelectItem value="edge">System Edge</SelectItem>
                  <SelectItem value="firefox">Firefox</SelectItem>
                  <SelectItem value="webkit">WebKit (Playwright)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-5 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Version
              </Label>
              <Select value={browserVersion} onValueChange={setBrowserVersion}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  {availableVersions.map((v) => (
                    <SelectItem key={v.browser_version} value={v.browser_version}>
                      {v.browser_version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Executable Path */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Browser Executable Path (Optional)
            </Label>
            <Input
              placeholder="Leave empty to auto-download / use default"
              value={executablePath}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExecutablePath(e.target.value)
              }
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tags
            </Label>
            <Input
              placeholder="facebook, main, ads (comma-separated)"
              value={tagsInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notes
            </Label>
            <Textarea
              className="min-h-[80px] resize-none"
              placeholder="Optional notes about this profile..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
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

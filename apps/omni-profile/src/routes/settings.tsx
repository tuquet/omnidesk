import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Label, Switch } from '@omnidesk/ui';
import { ChromeIcon, HardDriveIcon, SaveIcon, ShieldIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const [chromiumPath, setChromiumPath] = useState('');
  const [useSystemChrome, setUseSystemChrome] = useState(false);
  const [storagePath, setStoragePath] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Mock load settings
    setChromiumPath(localStorage.getItem('chromiumPath') || '');
    setUseSystemChrome(localStorage.getItem('useSystemChrome') === 'true');
    setStoragePath(localStorage.getItem('storagePath') || 'C:\\Users\\Default\\AppData\\Local\\OmniDesk\\Profiles');
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('chromiumPath', chromiumPath);
    localStorage.setItem('useSystemChrome', useSystemChrome.toString());
    localStorage.setItem('storagePath', storagePath);
    
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Profile settings saved successfully');
    }, 600);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Profile Settings</PageTitle>
      </PageHeader>

      <div className="max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChromeIcon className="w-5 h-5 text-primary" />
              <CardTitle>Browser Engine configuration</CardTitle>
            </div>
            <CardDescription>Configure which Chromium binary to use for launching profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-base">Use System Chrome</Label>
                <p className="text-sm text-muted-foreground">Try to find and use Chrome installed on your system instead of downloading a custom binary.</p>
              </div>
              <Switch checked={useSystemChrome} onCheckedChange={setUseSystemChrome} />
            </div>

            <div className="space-y-2">
              <Label>Custom Executable Path</Label>
              <Input 
                placeholder="C:\Path\To\chrome.exe" 
                value={chromiumPath}
                onChange={(e) => setChromiumPath(e.target.value)}
                disabled={useSystemChrome}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to automatically download a compatible Chromium version when launching the first profile.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDriveIcon className="w-5 h-5 text-primary" />
              <CardTitle>Storage & Privacy</CardTitle>
            </div>
            <CardDescription>Manage where browser data is stored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <Label>Profiles Storage Path</Label>
              <Input 
                value={storagePath}
                onChange={(e) => setStoragePath(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ShieldIcon className="w-3 h-3 text-yellow-500" />
                Changing this path will not move existing profiles. You must move them manually.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t px-4 py-3">
            <Button onClick={handleSave} disabled={isSaving}>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}

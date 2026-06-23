import { useState, useEffect } from 'react';
import { supabase } from './api/supabase';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@omnidesk/ui';
import { Box, Code, UploadCloud, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function DeveloperConsole() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form states
  const [newAppId, setNewAppId] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('Utilities');
  const [uploadingAppId, setUploadingAppId] = useState<string | null>(null);
  const [versionInput, setVersionInput] = useState('1.0.0');

  useEffect(() => {
    fetchSessionAndApps();
  }, []);

  async function fetchSessionAndApps() {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const uid = session?.user?.id;
      setUserId(uid || null);

      if (uid) {
        const { data, error } = await supabase
          .from('marketplace_apps')
          .select('*')
          .eq('owner_id', uid);
          
        if (error) throw error;
        setApps(data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load apps: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterApp(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return toast.error('You must be logged in');

    try {
      const { data, error } = await supabase
        .from('marketplace_apps')
        .insert({
          id: newAppId,
          name: newAppName,
          description: newAppDesc,
          category: newAppCategory,
          owner_id: userId,
          is_core: false,
          icon_name: 'Box',
          current_version: '1.0.0'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('App registered successfully!');
      setApps([...apps, data]);
      setNewAppId('');
      setNewAppName('');
      setNewAppDesc('');
      setNewAppCategory('Utilities');
    } catch (err: any) {
      toast.error('Registration failed: ' + err.message);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, appId: string) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAppId(appId);
    try {
      const filePath = `${appId}/${versionInput}.zip`;

      // Calculate SHA-256 hash of the file
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('app-packages')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('app-packages')
        .getPublicUrl(filePath);

      const downloadUrl = urlData.publicUrl;

      // Insert version record
      const { error: versionError } = await supabase
        .from('app_versions')
        .insert({
          app_id: appId,
          version: versionInput,
          download_url: downloadUrl,
          published_by: userId,
          package_hash: fileHash
        });

      if (versionError && versionError.code !== '23505') { // Ignore unique constraint for version history if re-uploading
        throw versionError;
      }

      // Update marketplace_apps current version
      const { error: updateError } = await supabase
        .from('marketplace_apps')
        .update({ 
          current_version: versionInput,
          download_url: downloadUrl,
          package_hash: fileHash
        })
        .eq('id', appId);

      if (updateError) throw updateError;

      toast.success(`Version ${versionInput} uploaded successfully!`);
      await fetchSessionAndApps(); // Refresh data

    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploadingAppId(null);
      // Reset file input
      e.target.value = '';
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center">Loading developer console...</div>;
  }

  if (!userId) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Developer Console</h2>
        <p className="text-muted-foreground">You must be logged in to access the developer console.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 lg:p-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Code className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Developer Console</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Registration Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Register New App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterApp} className="space-y-4">
              <div className="space-y-2">
                <Label>App ID</Label>
                <Input 
                  placeholder="e.g. my-awesome-app" 
                  value={newAppId} 
                  onChange={(e) => setNewAppId(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>App Name</Label>
                <Input 
                  placeholder="e.g. My Awesome App" 
                  value={newAppName} 
                  onChange={(e) => setNewAppName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newAppCategory} onValueChange={setNewAppCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Productivity">Productivity</SelectItem>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Short description..." 
                  value={newAppDesc} 
                  onChange={(e) => setNewAppDesc(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full">Register App</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: App List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Apps</h2>
          {apps.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              You haven't registered any apps yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {apps.map(app => (
                <Card key={app.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="h-5 w-5 text-muted-foreground" />
                        {app.name}
                      </div>
                      <span className="text-xs font-normal bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        v{app.current_version}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
                    
                    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border">
                      <h4 className="text-sm font-medium mb-1">Release New Version</h4>
                      <div className="flex items-end gap-2">
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">Version Number</Label>
                          <Input 
                            value={versionInput} 
                            onChange={(e) => setVersionInput(e.target.value)} 
                            placeholder="e.g. 1.0.1" 
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 flex-[2]">
                          <Label className="text-xs">Package (.zip)</Label>
                          <div className="relative">
                            <Input 
                              type="file" 
                              accept=".zip,application/zip"
                              className="h-9 pr-10"
                              onChange={(e) => handleFileUpload(e, app.id)}
                              disabled={uploadingAppId === app.id}
                            />
                            {uploadingAppId === app.id && (
                              <div className="absolute right-3 top-2.5">
                                <UploadCloud className="h-4 w-4 animate-bounce text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {app.download_url && (
                         <a href={app.download_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2">
                           Current Package Link
                         </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

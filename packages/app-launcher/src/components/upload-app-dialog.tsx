import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@omnidesk/ui';
import { FileArchive } from 'lucide-react';
import { toast } from 'sonner';

interface UploadAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadAppDialog({ open, onOpenChange }: UploadAppDialogProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      
      const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
      const selectedPath = await openDialog({
        multiple: false,
        filters: [{
          name: 'Omnidesk App Bundle',
          extensions: ['zip']
        }]
      });

      if (!selectedPath || typeof selectedPath !== 'string') {
        return; // User canceled
      }

      toast.loading('Installing App...', { id: 'installing' });

      // Call the Rust command dynamically to avoid loading it on web browser
      const { invoke } = await import('@tauri-apps/api/core');
      const response = await invoke<{ success: boolean; message: string; app_id: string }>('install_local_app', {
        zipPath: selectedPath
      });

      toast.dismiss('installing');

      if (response.success) {
        toast.success('App installed successfully!', {
          description: `App ID: ${response.app_id} is now available in your Installed tab.`,
        });
        onOpenChange(false);
      } else {
        toast.error('Installation failed', { description: response.message });
      }

    } catch (error: any) {
      toast.dismiss('installing');
      toast.error('Failed to install app', { description: error.message || error });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Install Third-Party App</DialogTitle>
          <DialogDescription>
            Upload an Omnidesk App Bundle (.zip) to install it locally.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div 
            className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
            onClick={!isUploading ? handleUpload : undefined}
          >
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <FileArchive className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-medium">Click to select an App Bundle</p>
              <p className="text-sm text-muted-foreground mt-1">Must be a valid Omnidesk .zip file</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@omnidesk/ui';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import Editor from '@monaco-editor/react';
import { useWorkspaceStore } from '@omnidesk/core';

interface WorkflowJsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string | null;
}

const DEFAULT_JSON = {
  name: "New Workflow",
  description: "",
  icon: "riGlobalLine",
  drawflow: {
    nodes: [],
    edges: [],
    zoom: 1.3
  },
  settings: {
    publicId: "",
    debugMode: false
  },
  global_data: "{\n  \"key\": \"value\"\n}"
};

export function WorkflowJsonEditorModal({
  isOpen,
  onClose,
  workflowId,
}: WorkflowJsonEditorModalProps) {
  const queryClient = useQueryClient();
  const { selectedWorkspacePath } = useWorkspaceStore();
  const isEditMode = !!workflowId;

  const [jsonValue, setJsonValue] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState(true);

  // Fetch workflow data if in edit mode
  const { data: workflowData, isLoading: isFetching } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      const { data, error } = await client.request({
        url: `/api/automa/workflows/${workflowId}`,
        method: 'GET',
      });
      if (error) throw error;
      return data;
    },
    enabled: isOpen && isEditMode,
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        if (workflowData) {
          setJsonValue(JSON.stringify(workflowData, null, 2));
        }
      } else {
        setJsonValue(JSON.stringify(DEFAULT_JSON, null, 2));
      }
      setIsValidJson(true);
    } else {
      setJsonValue('');
    }
  }, [isOpen, isEditMode, workflowData]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setJsonValue(value);
      try {
        JSON.parse(value);
        setIsValidJson(true);
      } catch (e) {
        setIsValidJson(false);
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (parsedData: any) => {
      const url = isEditMode ? `/api/automa/workflows/${workflowId}` : `/api/automa/workflows`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      const { data, error } = await client.request({
        url,
        method,
        body: parsedData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Workflow ${isEditMode ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Failed to save workflow: ${err.message || 'Unknown error'}`);
    },
  });

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      saveMutation.mutate(parsed);
    } catch (e) {
      toast.error('Invalid JSON format. Please fix the errors before saving.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{isEditMode ? 'Edit Workflow (JSON)' : 'Create Workflow (JSON)'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edit the raw JSON data of your workflow.' 
              : 'Write the raw JSON data for your new workflow.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative px-6 py-2">
          {isFetching ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          <div className="h-full border rounded-md overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonValue}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                formatOnPaste: true,
                formatOnType: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
              }}
            />
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 flex items-center justify-between sm:justify-between">
          <div className="text-sm">
            {isValidJson ? (
              <span className="text-green-500">Valid JSON</span>
            ) : (
              <span className="text-red-500">Invalid JSON format</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isValidJson || saveMutation.isPending || isFetching}
            >
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Workflow'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

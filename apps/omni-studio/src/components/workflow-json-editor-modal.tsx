import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@omnidesk/ui';
import {
  WorkflowParametersEditor,
  WorkflowTriggersEditor,
} from '@omnidesk/features';
import type { 
  WorkflowParameter, 
  WorkflowTrigger,
  WorkflowDataParsed
} from '@omnidesk/types';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import { getWorkflow, updateWorkflow, createWorkflow } from '@omnidesk/types/client';
import Editor from '@monaco-editor/react';
import { WorkflowVisualizer } from './workflow-visualizer';

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
  global_data: {},
  trigger: {
    parameters: [],
    triggers: []
  }
};

function getParameters(parsed: WorkflowDataParsed) {
  if (parsed.drawflow && Array.isArray(parsed.drawflow.nodes)) {
    const triggerNode = parsed.drawflow.nodes.find((n) => n.label === 'trigger');
    if (triggerNode?.data?.parameters && Array.isArray(triggerNode.data.parameters)) {
      return triggerNode.data.parameters;
    }
  }
  return Array.isArray(parsed.trigger?.parameters) ? parsed.trigger.parameters : [];
}

function getTriggers(parsed: WorkflowDataParsed) {
  if (parsed.drawflow && Array.isArray(parsed.drawflow.nodes)) {
    const triggerNode = parsed.drawflow.nodes.find((n) => n.label === 'trigger');
    if (triggerNode?.data?.triggers && Array.isArray(triggerNode.data.triggers)) {
      return triggerNode.data.triggers;
    }
  }
  return Array.isArray(parsed.trigger?.triggers) ? parsed.trigger.triggers : [];
}

function updateParameters(parsed: WorkflowDataParsed, parameters: WorkflowParameter[]) {
  parsed.trigger = parsed.trigger || {};
  parsed.trigger.parameters = parameters;
  
  if (parsed.drawflow && Array.isArray(parsed.drawflow.nodes)) {
    const triggerNode = parsed.drawflow.nodes.find((n) => n.label === 'trigger');
    if (triggerNode) {
      triggerNode.data = triggerNode.data || {};
      triggerNode.data.parameters = parameters;
    }
  }
}

function updateTriggers(parsed: WorkflowDataParsed, triggers: WorkflowTrigger[]) {
  parsed.trigger = parsed.trigger || {};
  parsed.trigger.triggers = triggers;
  
  if (parsed.drawflow && Array.isArray(parsed.drawflow.nodes)) {
    const triggerNode = parsed.drawflow.nodes.find((n) => n.label === 'trigger');
    if (triggerNode) {
      triggerNode.data = triggerNode.data || {};
      triggerNode.data.triggers = triggers;
    }
  }
}

// Inner Component handles its own state securely isolated from React Query background updates
function WorkflowEditorCore({ 
  initialData, 
  onClose, 
  workflowId, 
  isEditMode 
}: { 
  initialData: WorkflowDataParsed, 
  onClose: () => void, 
  workflowId: string | null,
  isEditMode: boolean 
}) {
  const queryClient = useQueryClient();
  const [jsonValue, setJsonValue] = useState<string>(() => JSON.stringify(initialData, null, 2));
  const [activeTab, setActiveTab] = useState<string>('json');
  const [globalDataStr, setGlobalDataStr] = useState<string>(() => JSON.stringify(initialData.global_data || {}, null, 2));

  const { parsedJson, isValidJson } = useMemo(() => {
    if (!jsonValue) return { parsedJson: null, isValidJson: true };
    try {
      const parsed = JSON.parse(jsonValue) as WorkflowDataParsed;
      return { parsedJson: parsed, isValidJson: true };
    } catch {
      return { parsedJson: null, isValidJson: false };
    }
  }, [jsonValue]);

  const isGlobalDataValid = useMemo(() => {
    try {
      JSON.parse(globalDataStr);
      return true;
    } catch {
      return false;
    }
  }, [globalDataStr]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setJsonValue(value);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (parsedData: WorkflowDataParsed) => {
      let response;
      if (isEditMode) {
        response = await updateWorkflow({
          client,
          path: { id: workflowId as string },
          body: parsedData,
        });
      } else {
        response = await createWorkflow({
          client,
          body: parsedData,
        });
      }
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Workflow ${isEditMode ? 'updated' : 'created'} successfully!`);
      // Update cache optimistically if we want, but simple invalidation is safer
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      if (workflowId) {
        queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      }
      onClose();
    },
    onError: () => {
      // toast is handled globally by api-client.ts
    },
  });

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonValue) as WorkflowDataParsed;
      saveMutation.mutate(parsed);
    } catch {
      toast.error('Invalid JSON format. Please fix the errors before saving.');
    }
  };

  return (
    <>
      <div className="flex-1 min-h-0 relative px-6 py-2 flex flex-col">
        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          if (val === 'global_data' && isValidJson) {
            try {
              const parsed = JSON.parse(jsonValue) as WorkflowDataParsed;
              setGlobalDataStr(JSON.stringify(parsed.global_data || {}, null, 2));
            } catch {
              // ignore
            }
          }
        }} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-2 self-start">
            <TabsTrigger value="json">JSON Editor</TabsTrigger>
            <TabsTrigger value="parameters" disabled={!isValidJson}>Parameters</TabsTrigger>
            <TabsTrigger value="triggers" disabled={!isValidJson}>Triggers</TabsTrigger>
            <TabsTrigger value="global_data" disabled={!isValidJson}>Global Data</TabsTrigger>
            <TabsTrigger value="visualize" disabled={!isValidJson}>Visualize</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="flex-1 min-h-0 border rounded-md overflow-hidden m-0">
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
          </TabsContent>

          <TabsContent value="parameters" className="flex-1 min-h-0 overflow-auto border rounded-md p-4 m-0 bg-background">
            {isValidJson && (
              <WorkflowParametersEditor
                value={parsedJson ? getParameters(parsedJson as WorkflowDataParsed) : []}
                onChange={(parameters) => {
                  setJsonValue((prevJson) => {
                    try {
                      const parsed = JSON.parse(prevJson) as WorkflowDataParsed;
                      updateParameters(parsed, parameters as WorkflowParameter[]);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return prevJson;
                    }
                  });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="triggers" className="flex-1 min-h-0 overflow-auto border rounded-md p-4 m-0 bg-background">
            {isValidJson && (
              <WorkflowTriggersEditor
                value={parsedJson ? getTriggers(parsedJson as WorkflowDataParsed) : []}
                onChange={(triggers) => {
                  setJsonValue((prevJson) => {
                    try {
                      const parsed = JSON.parse(prevJson) as WorkflowDataParsed;
                      updateTriggers(parsed, triggers as WorkflowTrigger[]);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return prevJson;
                    }
                  });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="global_data" className="flex-1 min-h-0 border rounded-md overflow-hidden m-0">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={globalDataStr}
              onChange={(val) => {
                if (val !== undefined) {
                  setGlobalDataStr(val);
                    try {
                      const parsedGlobal = JSON.parse(val) as Record<string, unknown>;
                      const parsedMain = JSON.parse(jsonValue) as WorkflowDataParsed;
                      parsedMain.global_data = parsedGlobal;
                      setJsonValue(JSON.stringify(parsedMain, null, 2));
                    } catch {
                      // wait for valid JSON
                    }
                }
              }}
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
          </TabsContent>

          <TabsContent value="visualize" className="flex-1 min-h-0 border rounded-md overflow-hidden m-0 bg-background relative">
            {isValidJson && parsedJson ? (
              <WorkflowVisualizer parsedJson={parsedJson} />
            ) : null}
          </TabsContent>
        </Tabs>
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
            disabled={!isValidJson || (activeTab === 'global_data' && !isGlobalDataValid) || saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? 'Save Changes' : 'Create Workflow'}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

// Wrapper component to handle data fetching before mounting the editor core
function WorkflowEditorDataWrapper({ 
  onClose, 
  workflowId 
}: { 
  onClose: () => void, 
  workflowId: string 
}) {
  const { data: workflowData, isLoading, isError } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const { data, error } = await getWorkflow({
        client,
        path: { id: workflowId },
      });
      if (error) throw error;
      return data;
    },
    // Prevent background refetches from replacing data mid-edit
    refetchOnWindowFocus: false,
    staleTime: 0, 
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !workflowData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Failed to load workflow data.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return <WorkflowEditorCore initialData={workflowData as WorkflowDataParsed} onClose={onClose} workflowId={workflowId} isEditMode={true} />;
}

export function WorkflowJsonEditorModal({
  isOpen,
  onClose,
  workflowId,
}: WorkflowJsonEditorModalProps) {
  const isEditMode = !!workflowId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{isEditMode ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edit the raw JSON data of your workflow.' 
              : 'Write the raw JSON data for your new workflow.'}
          </DialogDescription>
        </DialogHeader>
        
        {isOpen && isEditMode && workflowId && (
          <WorkflowEditorDataWrapper key={workflowId} onClose={onClose} workflowId={workflowId} />
        )}
        
        {isOpen && !isEditMode && (
          <WorkflowEditorCore initialData={DEFAULT_JSON as unknown as WorkflowDataParsed} onClose={onClose} workflowId={null} isEditMode={false} />
        )}
      </DialogContent>
    </Dialog>
  );
}


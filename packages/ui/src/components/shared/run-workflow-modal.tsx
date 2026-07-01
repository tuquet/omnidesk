import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
} from '../../index';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlayIcon } from 'lucide-react';

interface TriggerParameter {
  name: string;
  type: string;
  label?: string;
  defaultValue?: any;
}

export interface RunWorkflowModalProps {
  workflowId?: string | null;
  profileId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRunSuccess?: () => void;
}

export function RunWorkflowModal({ workflowId, profileId, isOpen, onClose, onRunSuccess }: RunWorkflowModalProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>(profileId || 'default');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(workflowId || '');
  const [variables, setVariables] = useState<Record<string, any>>({});

  // Sync props to state if they change
  useEffect(() => {
    if (profileId) setSelectedProfile(profileId);
  }, [profileId]);

  useEffect(() => {
    if (workflowId) setSelectedWorkflow(workflowId);
  }, [workflowId]);

  // 1. Fetch profiles from Profile Microservice (if no profileId passed)
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['browser-profiles'],
    queryFn: async () => {
      try {
        const res = await fetch('http://127.0.0.1:1421/api/browser-profiles');
        if (!res.ok) throw new Error('Failed to fetch profiles');
        return await res.json() as any[];
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    enabled: isOpen && !profileId, // only fetch if we need to let user select profile
  });

  // 1.5. Fetch workflows list from Studio Microservice (if no workflowId passed)
  const { data: workflowsList = [], isLoading: loadingWorkflowsList } = useQuery({
    queryKey: ['workflows-list'],
    queryFn: async () => {
      try {
        const res = await fetch('http://127.0.0.1:1422/api/automa/workflows');
        if (!res.ok) throw new Error('Failed to fetch workflows');
        return await res.json() as any[];
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    enabled: isOpen && !workflowId, // only fetch if we need to let user select workflow
  });

  // 2. Fetch specific workflow details to parse drawflow
  const { data: workflow, isLoading: loadingWorkflow } = useQuery({
    queryKey: ['workflow', selectedWorkflow],
    queryFn: async () => {
      if (!selectedWorkflow) return null;
      try {
        const res = await fetch(`http://127.0.0.1:1422/api/automa/workflows/${selectedWorkflow}`);
        if (!res.ok) throw new Error('Failed to fetch workflow');
        return await res.json() as any;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    enabled: isOpen && !!selectedWorkflow,
  });

  // 3. Extract Trigger Parameters
  const triggerParams = useMemo<TriggerParameter[]>(() => {
    if (!workflow?.drawflow) return [];
    try {
      let drawflowObj = workflow.drawflow;
      if (typeof drawflowObj === 'string') {
        drawflowObj = JSON.parse(drawflowObj);
      }
      
      const nodes = drawflowObj.drawflow?.Home?.data || drawflowObj.nodes || {};
      
      const nodesList = Array.isArray(nodes) ? nodes : Object.values(nodes);
      const triggerNode: any = nodesList.find((n: any) => n.name === 'trigger' || n.label === 'trigger');
      
      if (triggerNode && triggerNode.data && triggerNode.data.parameters) {
        const params = triggerNode.data.parameters;
        return Array.isArray(params) ? params : Object.values(params);
      }
    } catch (err) {
      console.error('Failed to parse drawflow', err);
    }
    return [];
  }, [workflow]);

  // Initialize variables from default values
  useEffect(() => {
    if (triggerParams.length > 0) {
      const initial: Record<string, any> = {};
      triggerParams.forEach(p => {
        initial[p.name] = p.defaultValue ?? (p.type === 'boolean' ? false : '');
      });
      // Only set if we haven't already edited them, to prevent overwrite
      setVariables(prev => Object.keys(prev).length === 0 ? initial : prev);
    } else {
      setVariables({});
    }
  }, [triggerParams, selectedWorkflow]); // reset when workflow changes

  // 4. Run Mutation
  const runMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkflow) throw new Error("Workflow is required");
      
      const payload: any = {
        workflow_id: selectedWorkflow,
        profile_id: selectedProfile !== 'default' ? selectedProfile : undefined,
      };
      
      if (Object.keys(variables).length > 0) {
        payload.variables = variables;
      }

      const res = await fetch('http://127.0.0.1:1422/api/automa/workflows/runs', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to start execution');
      }
    },
    onSuccess: () => {
      toast.success('Workflow execution started');
      onRunSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to start workflow');
    },
  });

  const handleVariableChange = (name: string, value: any) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const isLoading = (loadingProfiles && !profileId) || (loadingWorkflowsList && !workflowId) || loadingWorkflow;

  const handleClose = () => {
    // Reset state if needed
    if (!profileId) setSelectedProfile('default');
    if (!workflowId) setSelectedWorkflow('');
    setVariables({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Execution Order</DialogTitle>
          <DialogDescription>
            {workflow?.name ? `Configure execution options for "${workflow.name}"` : 'Select target workflow, profile, and parameters'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 py-4">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : (
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            
            {/* Step 1: Workflow Selection (If not provided) */}
            {!workflowId && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    1
                  </div>
                  <Label className="text-base font-semibold">Select Workflow</Label>
                </div>
                <div className="pl-9">
                  <Select value={selectedWorkflow || undefined} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a workflow to run..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {workflowsList.map((wf: any) => (
                        <SelectItem key={wf.id} value={wf.id} className="cursor-pointer">
                          {wf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Profile Selection (If not provided) */}
            {!profileId && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {workflowId ? '1' : '2'}
                  </div>
                  <Label className="text-base font-semibold">Target Profile</Label>
                </div>
                <div className="pl-9">
                  <Select value={selectedProfile || undefined} onValueChange={setSelectedProfile}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a browser profile..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="default" className="cursor-pointer font-medium text-primary">
                        Default Profile
                      </SelectItem>
                      {profiles.map((p: any) => (
                        <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[13px] text-muted-foreground mt-2 pl-1">
                    Select which browser profile environment to execute this workflow on.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Dynamic Trigger Variables */}
            {triggerParams.length > 0 && selectedWorkflow && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {(!workflowId && !profileId) ? '3' : (!workflowId || !profileId) ? '2' : '1'}
                  </div>
                  <Label className="text-base font-semibold">Trigger Parameters</Label>
                </div>
                
                <div className="pl-9 space-y-4">
                  <div className="p-4 rounded-md border bg-muted/50 space-y-4">
                    {triggerParams.map((param) => (
                      <div key={param.name} className="space-y-2 flex flex-col">
                        <Label htmlFor={`var-${param.name}`}>
                          {param.label || param.name}
                        </Label>
                        
                        {param.type === 'string' || param.type === 'text' || param.type === 'number' ? (
                          <Input
                            id={`var-${param.name}`}
                            type={param.type === 'number' ? 'number' : 'text'}
                            value={variables[param.name] ?? ''}
                            onChange={(e: any) => handleVariableChange(param.name, param.type === 'number' ? Number(e.target.value) : e.target.value)}
                            placeholder={`Enter ${param.name}...`}
                          />
                        ) : param.type === 'boolean' ? (
                          <Switch
                            id={`var-${param.name}`}
                            checked={!!variables[param.name]}
                            onCheckedChange={(checked: boolean) => handleVariableChange(param.name, checked)}
                          />
                        ) : (
                          <Input
                            id={`var-${param.name}`}
                            value={variables[param.name] ?? ''}
                            onChange={(e: any) => handleVariableChange(param.name, e.target.value)}
                            placeholder={`Enter ${param.name}...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={runMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => runMutation.mutate()} 
            disabled={runMutation.isPending || isLoading || !selectedWorkflow}
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            {runMutation.isPending ? 'Starting...' : 'Execute Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

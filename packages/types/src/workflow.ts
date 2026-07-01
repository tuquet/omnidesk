export interface WorkflowParameter {
  id: string;
  name: string;
  type: string;
  description?: string;
  defaultValue?: any;
  placeholder?: string;
  label?: string;
  data?: {
    required?: boolean;
    useMask?: boolean;
    unmaskValue?: boolean;
    [key: string]: unknown;
  };
}

export interface WorkflowTrigger {
  id?: string;
  type: string;
  config?: any;
  data?: any;
  enabled?: boolean;
}

export interface DrawflowNode {
  id?: string | number;
  label?: string;
  type?: string;
  data?: {
    parameters?: WorkflowParameter[];
    triggers?: WorkflowTrigger[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DrawflowEdge {
  id?: string | number;
  source: string | number;
  target: string | number;
}

export interface DrawflowData {
  nodes?: DrawflowNode[] | Record<string, DrawflowNode>;
  edges?: DrawflowEdge[] | Record<string, DrawflowEdge>;
}

export interface WorkflowDataParsed {
  drawflow?: DrawflowData;
  trigger?: {
    parameters?: WorkflowParameter[];
    triggers?: WorkflowTrigger[];
    [key: string]: unknown;
  };
  global_data?: Record<string, unknown>;
  [key: string]: unknown;
}


export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  is_disabled: number | null;
  updated_at: string | null;
  created_at?: string | null;
  content?: string | null;
  connected_table?: string | null;
  drawflow?: { nodes?: any[]; edges?: any[]; [key: string]: any } | string | null;
  global_data?: string | null;
  table_data?: any[] | null;
  settings?: Record<string, any> | string | null;
  trigger?: { parameters?: any[]; triggers?: any[]; [key: string]: any } | string | null;
  [key: string]: any;
};

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  profile_id: string | null;
  schedule_id: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  error_message: string | null;
  summary: string | null;
};

export type WorkflowLog = {
  id: string;
  run_id: string;
  block_id: string;
  block_label: string;
  status: string;
  duration_ms: number | null;
  data: string | null;
};

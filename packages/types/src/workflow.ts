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

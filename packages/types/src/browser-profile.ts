export interface BrowserProfile {
  id: string;
  name: string;
  group_id: string | null;
  os: string | null;
  browser_type: string | null;
  data_dir_path: string;
  status: string | null;
  last_used_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  proxy?: string | null;
  tags?: string | null;
  notes?: string | null;
  pid?: number | null;
  browser_version?: string | null;
}

export interface CreateBrowserProfilePayload {
  user_agent?: string | null;
  name: string;
  browser_type?: string | null;
  data_dir_path: string;
  group_id?: string | null;
  os?: string | null;
  status?: string | null;
  proxy?: string | null;
  tags?: string | null;
  notes?: string | null;
  executable_path?: string | null;
  browser_version?: string | null;
}

export interface UpdateBrowserProfilePayload {
  id: string;
  name: string;
  browser_type?: string | null;
  data_dir_path: string;
  group_id?: string | null;
  os?: string | null;
  status?: string | null;
  proxy?: string | null;
  tags?: string | null;
  notes?: string | null;
  executable_path?: string | null;
  browser_version?: string | null;
}

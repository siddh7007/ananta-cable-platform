// Admin types for the Cable Platform portal
// These types support admin functionality like user management

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: 'active' | 'deactivated';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserActionResponse {
  success: boolean;
  user: AdminUser;
  message?: string;
}

// Database statistics types
export interface DbConnectionStatus {
  status: 'ok' | 'fail' | 'unknown';
  latencyMs?: number;
  note?: string;
}

export interface DbStats {
  supabase: DbConnectionStatus;
  pgExtra?: DbConnectionStatus;
  oracle?: DbConnectionStatus;
  counts: {
    workspaces: number;
    projects: number;
    boms: number;
    orders: number;
    users: number;
  };
  ts: string; // ISO timestamp
}

export interface AdminDbData {
  stats?: DbStats;
  error?: string;
}

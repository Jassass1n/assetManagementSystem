export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: "admin" | "it_staff" | "viewer"
  department?: string
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface AssetCategory {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Asset {
  id: string
  asset_tag: string
  name: string
  description?: string
  category_id?: string
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_cost?: number
  warranty_expiry?: string
  status: "available" | "assigned" | "under_repair" | "retired"
  location?: string
  notes?: string
  assigned_to?: string
  assigned_date?: string
  department_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined data
  category?: AssetCategory
  assignee?: Profile
  department?: Department
  creator?: Profile
}

export interface AuditLog {
  id: string
  asset_id: string
  action: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  performed_by?: string
  performed_at: string
  notes?: string
  // Joined data
  performer?: Profile
  asset?: Asset
}

export type AssetStatus = "available" | "assigned" | "under_repair" | "retired"
export type UserRole = "admin" | "it_staff" | "viewer"

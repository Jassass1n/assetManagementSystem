import { createClient } from "@/lib/supabase/client"
import type { Asset } from "./types"

export interface AuditLogData {
  asset_id: string
  action: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  notes?: string
}

export interface LogAuditEventParams {
  asset_id: string
  action: string
  notes: string
  performed_by: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
}

export class AuditLogger {
  private supabase = createClient()

  async logAssetCreated(asset: Asset, performedBy: string, notes?: string) {
    return this.createAuditLog(
      {
        asset_id: asset.id,
        action: "created",
        new_values: {
          name: asset.name,
          asset_tag: asset.asset_tag,
          status: asset.status,
          category_id: asset.category_id,
          brand: asset.brand,
          model: asset.model,
          serial_number: asset.serial_number,
          department_id: asset.department_id,
        },
        notes,
      },
      performedBy,
    )
  }

  async logAssetUpdated(
    assetId: string,
    oldValues: Partial<Asset>,
    newValues: Partial<Asset>,
    performedBy: string,
    notes?: string,
  ) {
    return this.createAuditLog(
      {
        asset_id: assetId,
        action: "updated",
        old_values: oldValues,
        new_values: newValues,
        notes,
      },
      performedBy,
    )
  }

  async logAssetAssigned(
    assetId: string,
    assignedTo: string,
    assignedBy: string,
    previousAssignee?: string,
    notes?: string,
  ) {
    return this.createAuditLog(
      {
        asset_id: assetId,
        action: "assigned",
        old_values: previousAssignee ? { assigned_to: previousAssignee } : undefined,
        new_values: { assigned_to: assignedTo },
        notes,
      },
      assignedBy,
    )
  }

  async logAssetUnassigned(assetId: string, previousAssignee: string, unassignedBy: string, notes?: string) {
    return this.createAuditLog(
      {
        asset_id: assetId,
        action: "unassigned",
        old_values: { assigned_to: previousAssignee },
        new_values: { assigned_to: null },
        notes,
      },
      unassignedBy,
    )
  }

  async logStatusChange(assetId: string, oldStatus: string, newStatus: string, performedBy: string, notes?: string) {
    return this.createAuditLog(
      {
        asset_id: assetId,
        action: "status_changed",
        old_values: { status: oldStatus },
        new_values: { status: newStatus },
        notes,
      },
      performedBy,
    )
  }

  async logAssetDeleted(asset: Asset, performedBy: string, notes?: string) {
    return this.createAuditLog(
      {
        asset_id: asset.id,
        action: "deleted",
        old_values: {
          name: asset.name,
          asset_tag: asset.asset_tag,
          status: asset.status,
        },
        notes,
      },
      performedBy,
    )
  }

  private async createAuditLog(logData: AuditLogData, performedBy: string) {
    const { data, error } = await this.supabase.from("audit_logs").insert({
      ...logData,
      performed_by: performedBy,
    })

    if (error) {
      console.error("Failed to create audit log:", error)
      throw error
    }

    return data
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

export async function logAuditEvent(params: LogAuditEventParams) {
  const { data, error } = await createClient()
    .from("audit_logs")
    .insert({
      asset_id: params.asset_id,
      action: params.action,
      notes: params.notes,
      performed_by: params.performed_by,
      old_values: params.old_values || null,
      new_values: params.new_values || null,
    })

  if (error) {
    console.error("Failed to create audit log:", error)
    throw error
  }

  return data
}

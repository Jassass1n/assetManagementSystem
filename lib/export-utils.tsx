import type { Asset, Profile, AuditLog, Department, AssetCategory } from "./types"

export interface ExportData {
  assets?: Asset[]
  employees?: Profile[]
  auditLogs?: AuditLog[]
  departments?: Department[]
  categories?: AssetCategory[]
}

export interface ExportOptions {
  format: "pdf" | "csv" | "excel"
  type: "assets" | "employees" | "audit_logs" | "departments"
  filters?: Record<string, any>
  includeDetails?: boolean
}

export function generateCSV(data: any[], filename: string): void {
  if (!data.length) return

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle nested objects and arrays
          if (typeof value === "object" && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || "")
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(","),
    ),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function flattenAssetForExport(asset: Asset) {
  return {
    asset_tag: asset.asset_tag,
    name: asset.name,
    description: asset.description || "",
    category: asset.category?.name || "",
    brand: asset.brand || "",
    model: asset.model || "",
    serial_number: asset.serial_number || "",
    purchase_date: asset.purchase_date || "",
    purchase_cost: asset.purchase_cost || "",
    warranty_expiry: asset.warranty_expiry || "",
    status: asset.status,
    location: asset.location || "",
    assigned_to: asset.assignee
      ? `${asset.assignee.first_name || ""} ${asset.assignee.last_name || ""}`.trim() || asset.assignee.email
      : "",
    assigned_date: asset.assigned_date || "",
    department: asset.department?.name || "",
    notes: asset.notes || "",
    created_at: asset.created_at,
    updated_at: asset.updated_at,
  }
}

export function flattenEmployeeForExport(
  employee: Profile & { department?: Department; assigned_assets_count?: number },
) {
  return {
    first_name: employee.first_name || "",
    last_name: employee.last_name || "",
    email: employee.email,
    role: employee.role,
    department: employee.department?.name || "",
    assigned_assets: employee.assigned_assets_count || 0,
    created_at: employee.created_at,
    updated_at: employee.updated_at,
  }
}

export function flattenAuditLogForExport(log: AuditLog) {
  return {
    asset_name: log.asset?.name || "",
    asset_tag: log.asset?.asset_tag || "",
    action: log.action,
    performed_by: log.performer
      ? `${log.performer.first_name || ""} ${log.performer.last_name || ""}`.trim() || log.performer.email
      : "System",
    performed_at: log.performed_at,
    old_values: log.old_values ? JSON.stringify(log.old_values) : "",
    new_values: log.new_values ? JSON.stringify(log.new_values) : "",
    notes: log.notes || "",
  }
}

export function generatePDFContent(data: ExportData, type: string): string {
  const currentDate = new Date().toLocaleDateString()

  let content = `
    <html>
      <head>
        <title>IT Asset Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #666; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status-available { color: #16a34a; font-weight: bold; }
          .status-assigned { color: #2563eb; font-weight: bold; }
          .status-under_repair { color: #ea580c; font-weight: bold; }
          .status-retired { color: #6b7280; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">IT Asset Management Report</div>
          <div class="subtitle">Generated on ${currentDate}</div>
        </div>
  `

  if (type === "assets" && data.assets) {
    content += `
      <div class="section">
        <div class="section-title">Asset Inventory (${data.assets.length} items)</div>
        <table>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand/Model</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Department</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
    `

    data.assets.forEach((asset) => {
      const assignedTo = asset.assignee
        ? `${asset.assignee.first_name || ""} ${asset.assignee.last_name || ""}`.trim() || asset.assignee.email
        : ""

      content += `
        <tr>
          <td>${asset.asset_tag}</td>
          <td>${asset.name}</td>
          <td>${asset.category?.name || ""}</td>
          <td>${asset.brand || ""} ${asset.model || ""}</td>
          <td class="status-${asset.status}">${asset.status.replace("_", " ")}</td>
          <td>${assignedTo}</td>
          <td>${asset.department?.name || ""}</td>
          <td>${asset.location || ""}</td>
        </tr>
      `
    })

    content += `
          </tbody>
        </table>
      </div>
    `
  }

  if (type === "employees" && data.employees) {
    content += `
      <div class="section">
        <div class="section-title">Employee Directory (${data.employees.length} employees)</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Assigned Assets</th>
            </tr>
          </thead>
          <tbody>
    `

    data.employees.forEach((employee) => {
      const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.email

      content += `
        <tr>
          <td>${fullName}</td>
          <td>${employee.email}</td>
          <td>${employee.role.replace("_", " ")}</td>
          <td>${(employee as any).department?.name || ""}</td>
          <td>${(employee as any).assigned_assets_count || 0}</td>
        </tr>
      `
    })

    content += `
          </tbody>
        </table>
      </div>
    `
  }

  content += `
        <div class="footer">
          <p>This report was generated by the IT Asset Management System</p>
          <p>Report Date: ${currentDate}</p>
        </div>
      </body>
    </html>
  `

  return content
}

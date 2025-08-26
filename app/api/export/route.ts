import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import {
  generatePDFContent,
  flattenAssetForExport,
  flattenEmployeeForExport,
  flattenAuditLogForExport,
} from "@/lib/export-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (!profile || !["admin", "it_staff"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { type, format, filters = {} } = await request.json()

    let data: any[] = []
    let filename = ""

    switch (type) {
      case "assets":
        const { data: assets } = await supabase
          .from("assets")
          .select(`
            *,
            category:asset_categories(id, name),
            assignee:profiles!assets_assigned_to_fkey(id, first_name, last_name, email),
            department:departments(id, name),
            creator:profiles!assets_created_by_fkey(id, first_name, last_name, email)
          `)
          .order("created_at", { ascending: false })

        data = (assets || []).map(flattenAssetForExport)
        filename = `assets_export_${new Date().toISOString().split("T")[0]}`
        break

      case "employees":
        const { data: employees } = await supabase
          .from("profiles")
          .select(`
            *,
            department:departments(id, name)
          `)
          .order("created_at", { ascending: false })

        // Get asset counts for each employee
        const employeeIds = employees?.map((emp) => emp.id) || []
        const { data: assetCounts } = await supabase
          .from("assets")
          .select("assigned_to")
          .in("assigned_to", employeeIds)
          .not("assigned_to", "is", null)

        const assetCountMap = (assetCounts || []).reduce(
          (acc, asset) => {
            if (asset.assigned_to) {
              acc[asset.assigned_to] = (acc[asset.assigned_to] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        )

        const employeesWithCounts = (employees || []).map((employee) => ({
          ...employee,
          assigned_assets_count: assetCountMap[employee.id] || 0,
        }))

        data = employeesWithCounts.map(flattenEmployeeForExport)
        filename = `employees_export_${new Date().toISOString().split("T")[0]}`
        break

      case "audit_logs":
        const { data: auditLogs } = await supabase
          .from("audit_logs")
          .select(`
            *,
            asset:assets(id, name, asset_tag),
            performer:profiles!audit_logs_performed_by_fkey(id, first_name, last_name, email)
          `)
          .order("performed_at", { ascending: false })
          .limit(1000)

        data = (auditLogs || []).map(flattenAuditLogForExport)
        filename = `audit_logs_export_${new Date().toISOString().split("T")[0]}`
        break

      case "departments":
        const { data: departments } = await supabase.from("departments").select("*").order("name", { ascending: true })

        data = departments || []
        filename = `departments_export_${new Date().toISOString().split("T")[0]}`
        break

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }

    if (format === "pdf") {
      const htmlContent = generatePDFContent({ [type]: data }, type)

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${filename}.html"`,
        },
      })
    } else {
      // Return CSV data
      return NextResponse.json({
        data,
        filename,
        count: data.length,
      })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

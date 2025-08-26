"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExportDialog } from "@/components/export-dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Package,
  Users,
  Building2,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react"

interface ReportStats {
  totalAssets: number
  availableAssets: number
  assignedAssets: number
  underRepairAssets: number
  retiredAssets: number
  totalEmployees: number
  totalDepartments: number
  recentAuditLogs: number
  assetsNearWarrantyExpiry: number
}

export function ReportsOverview() {
  const [stats, setStats] = useState<ReportStats>({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    underRepairAssets: 0,
    retiredAssets: 0,
    totalEmployees: 0,
    totalDepartments: 0,
    recentAuditLogs: 0,
    assetsNearWarrantyExpiry: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const supabase = createClient()

    try {
      // Get asset stats
      const { data: assets } = await supabase.from("assets").select("status, warranty_expiry")

      // Get employee count
      const { data: employees } = await supabase.from("profiles").select("id")

      // Get department count
      const { data: departments } = await supabase.from("departments").select("id")

      // Get recent audit logs (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("id")
        .gte("performed_at", thirtyDaysAgo.toISOString())

      // Calculate stats
      const assetStats = (assets || []).reduce(
        (acc, asset) => {
          acc.totalAssets++
          switch (asset.status) {
            case "available":
              acc.availableAssets++
              break
            case "assigned":
              acc.assignedAssets++
              break
            case "under_repair":
              acc.underRepairAssets++
              break
            case "retired":
              acc.retiredAssets++
              break
          }

          // Check warranty expiry (within 90 days)
          if (asset.warranty_expiry) {
            const warrantyDate = new Date(asset.warranty_expiry)
            const ninetyDaysFromNow = new Date()
            ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
            if (warrantyDate <= ninetyDaysFromNow && warrantyDate >= new Date()) {
              acc.assetsNearWarrantyExpiry++
            }
          }

          return acc
        },
        {
          totalAssets: 0,
          availableAssets: 0,
          assignedAssets: 0,
          underRepairAssets: 0,
          retiredAssets: 0,
          assetsNearWarrantyExpiry: 0,
        },
      )

      setStats({
        ...assetStats,
        totalEmployees: employees?.length || 0,
        totalDepartments: departments?.length || 0,
        recentAuditLogs: auditLogs?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const utilizationRate = stats.totalAssets > 0 ? (stats.assignedAssets / stats.totalAssets) * 100 : 0
  const availabilityRate = stats.totalAssets > 0 ? (stats.availableAssets / stats.totalAssets) * 100 : 0

  const reportCards = [
    {
      title: "Asset Inventory Report",
      description: "Complete asset listing with status and assignments",
      icon: Package,
      exportType: "assets",
      stats: [
        { label: "Total Assets", value: stats.totalAssets, color: "text-blue-600" },
        { label: "Available", value: stats.availableAssets, color: "text-green-600" },
        { label: "Assigned", value: stats.assignedAssets, color: "text-purple-600" },
        { label: "Under Repair", value: stats.underRepairAssets, color: "text-orange-600" },
      ],
    },
    {
      title: "Employee Directory Report",
      description: "Employee information with asset assignments",
      icon: Users,
      exportType: "employees",
      stats: [
        { label: "Total Employees", value: stats.totalEmployees, color: "text-blue-600" },
        { label: "Departments", value: stats.totalDepartments, color: "text-green-600" },
      ],
    },
    {
      title: "Audit Trail Report",
      description: "Activity logs and change history",
      icon: Activity,
      exportType: "audit_logs",
      stats: [
        { label: "Recent Activities", value: stats.recentAuditLogs, color: "text-blue-600" },
        { label: "Last 30 Days", value: "30 days", color: "text-muted-foreground" },
      ],
    },
    {
      title: "Department Structure Report",
      description: "Organizational structure and asset distribution",
      icon: Building2,
      exportType: "departments",
      stats: [{ label: "Total Departments", value: stats.totalDepartments, color: "text-blue-600" }],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate.toFixed(1)}%</div>
            <Progress value={utilizationRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.assignedAssets} of {stats.totalAssets} assets assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Availability Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availabilityRate.toFixed(1)}%</div>
            <Progress value={availabilityRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{stats.availableAssets} assets ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assetsNearWarrantyExpiry}</div>
            <p className="text-xs text-muted-foreground mt-2">Assets expiring within 90 days</p>
            {stats.assetsNearWarrantyExpiry > 0 && (
              <Badge variant="destructive" className="mt-2">
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAuditLogs}</div>
            <p className="text-xs text-muted-foreground mt-2">Actions in the last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Reports</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reportCards.map((report) => (
            <Card key={report.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <report.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                  <ExportDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {report.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

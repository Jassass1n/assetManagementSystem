"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Package, Users, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Database, Shield } from "lucide-react"

interface SystemStats {
  totalAssets: number
  availableAssets: number
  assignedAssets: number
  underRepairAssets: number
  retiredAssets: number
  totalEmployees: number
  adminUsers: number
  itStaffUsers: number
  viewerUsers: number
  totalDepartments: number
  totalCategories: number
  totalAuditLogs: number
  recentAuditLogs: number
  assetsNearWarrantyExpiry: number
}

export function SystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    underRepairAssets: 0,
    retiredAssets: 0,
    totalEmployees: 0,
    adminUsers: 0,
    itStaffUsers: 0,
    viewerUsers: 0,
    totalDepartments: 0,
    totalCategories: 0,
    totalAuditLogs: 0,
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

      // Get user stats
      const { data: users } = await supabase.from("profiles").select("role")

      // Get department count
      const { data: departments } = await supabase.from("departments").select("id")

      // Get category count
      const { data: categories } = await supabase.from("asset_categories").select("id")

      // Get audit log stats
      const { data: allAuditLogs } = await supabase.from("audit_logs").select("id, performed_at")

      // Get recent audit logs (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentLogs = (allAuditLogs || []).filter((log) => new Date(log.performed_at) >= thirtyDaysAgo)

      // Calculate asset stats
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

      // Calculate user stats
      const userStats = (users || []).reduce(
        (acc, user) => {
          acc.totalEmployees++
          switch (user.role) {
            case "admin":
              acc.adminUsers++
              break
            case "it_staff":
              acc.itStaffUsers++
              break
            case "viewer":
              acc.viewerUsers++
              break
          }
          return acc
        },
        { totalEmployees: 0, adminUsers: 0, itStaffUsers: 0, viewerUsers: 0 },
      )

      setStats({
        ...assetStats,
        ...userStats,
        totalDepartments: departments?.length || 0,
        totalCategories: categories?.length || 0,
        totalAuditLogs: allAuditLogs?.length || 0,
        recentAuditLogs: recentLogs.length,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const utilizationRate = stats.totalAssets > 0 ? (stats.assignedAssets / stats.totalAssets) * 100 : 0
  const availabilityRate = stats.totalAssets > 0 ? (stats.availableAssets / stats.totalAssets) * 100 : 0

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
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
            <CardTitle className="text-sm font-medium">System Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAuditLogs}</div>
            <p className="text-xs text-muted-foreground mt-2">Actions in the last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Asset Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Statistics
            </CardTitle>
            <CardDescription>Overview of all assets in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAssets}</div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.availableAssets}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.assignedAssets}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.underRepairAssets}</div>
                <div className="text-sm text-muted-foreground">Under Repair</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Statistics
            </CardTitle>
            <CardDescription>User accounts and role distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.adminUsers}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.itStaffUsers}</div>
                <div className="text-sm text-muted-foreground">IT Staff</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.viewerUsers}</div>
                <div className="text-sm text-muted-foreground">Viewers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Database and system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalDepartments}</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalCategories}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAuditLogs}</div>
                <div className="text-sm text-muted-foreground">Audit Logs</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Secure</span>
                </div>
                <div className="text-sm text-muted-foreground">RLS Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Overview
            </CardTitle>
            <CardDescription>Recent system activity and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Recent Activity (30 days)</span>
                <Badge variant="secondary">{stats.recentAuditLogs} actions</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Audit Trail</span>
                <Badge variant="secondary">{stats.totalAuditLogs} entries</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">System Status</span>
                <Badge variant="default" className="bg-green-600">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

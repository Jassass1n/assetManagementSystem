"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Asset, AssetCategory, Department, Profile, AuditLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AssetActions } from "@/components/asset-actions"
import { ArrowLeft, Edit, Calendar, DollarSign, MapPin, Package, User, Building } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"

const statusColors = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  under_repair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  retired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

interface AssetDetailsProps {
  asset: Asset & {
    category?: AssetCategory
    assignee?: Profile
    department?: Department
    creator?: Profile
  }
  userProfile: Profile
}

export function AssetDetails({ asset, userProfile }: AssetDetailsProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [asset.id])

  const fetchAuditLogs = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("audit_logs")
      .select(`
        *,
        performer:profiles(id, first_name, last_name, email)
      `)
      .eq("asset_id", asset.id)
      .order("created_at", { ascending: false })
      .limit(10)

    setAuditLogs(data || [])
    setLoading(false)
  }

  const canEdit = userProfile.role === "admin" || userProfile.role === "it_staff"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/assets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assets
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <AssetActions asset={asset} onUpdate={fetchAuditLogs} />
              <Button asChild>
                <Link href={`/dashboard/assets/${asset.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Asset
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{asset.name}</CardTitle>
                <Badge className={statusColors[asset.status]}>{asset.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Asset Tag</p>
                    <p className="font-medium">{asset.asset_tag}</p>
                  </div>
                </div>

                {asset.brand && asset.model && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Brand/Model</p>
                      <p className="font-medium">
                        {asset.brand} {asset.model}
                      </p>
                    </div>
                  </div>
                )}

                {asset.serial_number && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Serial Number</p>
                      <p className="font-medium">{asset.serial_number}</p>
                    </div>
                  </div>
                )}

                {asset.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{asset.location}</p>
                    </div>
                  </div>
                )}

                {asset.category && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{asset.category.name}</p>
                    </div>
                  </div>
                )}

                {asset.department && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{asset.department.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {asset.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{asset.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.assignee ? (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned to</p>
                    <p className="font-medium">
                      {asset.assignee.first_name && asset.assignee.last_name
                        ? `${asset.assignee.first_name} ${asset.assignee.last_name}`
                        : asset.assignee.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">This asset is not currently assigned to anyone.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{log.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.performer?.first_name && log.performer?.last_name
                            ? `${log.performer.first_name} ${log.performer.last_name}`
                            : log.performer?.email || "System"}{" "}
                          • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity for this asset.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.purchase_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{format(new Date(asset.purchase_date), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              )}

              {asset.purchase_price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-medium">${asset.purchase_price.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {asset.warranty_expiry && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                    <p className="font-medium">{format(new Date(asset.warranty_expiry), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              )}

              {!asset.purchase_date && !asset.purchase_price && !asset.warranty_expiry && (
                <p className="text-muted-foreground text-sm">No financial information available.</p>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</p>
              </div>

              {asset.creator && (
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="font-medium">
                    {asset.creator.first_name && asset.creator.last_name
                      ? `${asset.creator.first_name} ${asset.creator.last_name}`
                      : asset.creator.email}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="font-medium">{formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true })}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

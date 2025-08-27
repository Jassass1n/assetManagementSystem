"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Asset, AssetCategory, Department, Profile, AuditLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AssetActions } from "@/components/asset-actions"
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, MapPin, Package, User, Building } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

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

const handleDelete = async () => {
  if (!confirm("Are you sure you want to delete this asset?")) return
  setDeleting(true)

  const supabase = createClient()

  // Log deletion
  await supabase.from("audit_logs").insert({
    asset_id: asset.id,
    action: "deleted",
    performer_id: userProfile.id,
  })

  // Soft delete (mark deleted_at + retired)
  const { error } = await supabase
    .from("assets")
    .update({ deleted_at: new Date().toISOString(), status: "retired" })
    .eq("id", asset.id)

  if (error) {
    alert("Failed to delete asset: " + error.message)
    setDeleting(false)
    return
  }

  // ✅ Redirect to asset listing
  router.push("/dashboard/assets")
  router.refresh?.() // In Next.js 13+ App Router
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/assets"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to assets
        </Link>

        {canEdit && (
          <div className="flex space-x-2">
            <Link href={`/assets/${asset.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{asset.name}</span>
            <Badge className={statusColors[asset.status]}>
              {asset.status.replace("_", " ")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                <dd>{asset.category?.name || "Uncategorized"}</dd>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                <dd>{asset.department?.name || "N/A"}</dd>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Assigned To</dt>
                <dd>
                  {asset.assignee
                    ? `${asset.assignee.first_name} ${asset.assignee.last_name}`
                    : "Unassigned"}
                </dd>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Purchase Date</dt>
                <dd>
                  {asset.purchase_date
                    ? format(new Date(asset.purchase_date), "PPP")
                    : "N/A"}
                </dd>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Purchase Cost</dt>
                <dd>
                  {asset.purchase_cost
                    ? `$${asset.purchase_cost.toFixed(2)}`
                    : "N/A"}
                </dd>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                <dd>{asset.location || "N/A"}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : auditLogs.length > 0 ? (
            <ul className="space-y-2">
              {auditLogs.map((log) => (
                <li key={log.id} className="text-sm">
                  <span className="font-medium">
                    {log.performer
                      ? `${log.performer.first_name} ${log.performer.last_name}`
                      : "System"}
                  </span>{" "}
                  {log.action} this asset{" "}
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

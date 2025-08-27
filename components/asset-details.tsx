"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Asset, AssetCategory, Department, Profile, AuditLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AssetActions } from "@/components/asset-actions"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
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
    if (!confirm("Are you sure you want to delete this asset? This action cannot be undone.")) return
    setDeleting(true)

    const supabase = createClient()

    // Delete asset from DB
    const { error } = await supabase.from("assets").delete().eq("id", asset.id)

    if (error) {
      alert("Failed to delete asset: " + error.message)
      setDeleting(false)
      return
    }

    // Add audit log
    await supabase.from("audit_logs").insert({
      asset_id: asset.id,
      action: "deleted",
      performer_id: userProfile.id,
    })

    // Redirect to assets list
    router.push("/assets")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
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

      {/* Existing content continues... */}

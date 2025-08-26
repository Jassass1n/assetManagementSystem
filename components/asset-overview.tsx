"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Asset } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export function AssetOverview() {
  const [recentAssets, setRecentAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentAssets()
  }, [])

  const fetchRecentAssets = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from("assets")
      .select(`
        *,
        category:asset_categories(name),
        assignee:profiles!assets_assigned_to_fkey(first_name, last_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    setRecentAssets(data || [])
    setLoading(false)
  }

  const statusColors = {
    available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    under_repair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    retired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Assets</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentAssets.length > 0 ? (
          <div className="space-y-4">
            {recentAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {asset.category?.name} • {asset.asset_tag}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge className={statusColors[asset.status]}>{asset.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No assets found</p>
        )}
      </CardContent>
    </Card>
  )
}

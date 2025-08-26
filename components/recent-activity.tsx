"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AuditLog } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export function RecentActivity() {
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from("audit_logs")
      .select(`
        *,
        asset:assets(name, asset_tag),
        performer:profiles!audit_logs_performed_by_fkey(first_name, last_name, email)
      `)
      .order("performed_at", { ascending: false })
      .limit(10)

    setActivities(data || [])
    setLoading(false)
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
        return "text-green-600"
      case "updated":
        return "text-blue-600"
      case "assigned":
        return "text-purple-600"
      case "unassigned":
        return "text-orange-600"
      case "deleted":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
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
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getActionColor(activity.action)}`}>{activity.action}</span>
                  <span className="text-sm">
                    {activity.asset?.name} ({activity.asset?.asset_tag})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    by{" "}
                    {activity.performer?.first_name && activity.performer?.last_name
                      ? `${activity.performer.first_name} ${activity.performer.last_name}`
                      : activity.performer?.email || "System"}
                  </span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(activity.performed_at), { addSuffix: true })}</span>
                </div>
                {activity.notes && <p className="text-sm text-muted-foreground">{activity.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  )
}

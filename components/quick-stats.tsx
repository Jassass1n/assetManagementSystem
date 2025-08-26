"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, AlertTriangle, CheckCircle } from "lucide-react"

interface Stats {
  totalAssets: number
  availableAssets: number
  assignedAssets: number
  underRepairAssets: number
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    underRepairAssets: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const supabase = createClient()

    const { data: assets } = await supabase.from("assets").select("status")

    if (assets) {
      const stats = assets.reduce(
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
          }
          return acc
        },
        { totalAssets: 0, availableAssets: 0, assignedAssets: 0, underRepairAssets: 0 },
      )

      setStats(stats)
    }

    setLoading(false)
  }

  const statCards = [
    {
      title: "Total Assets",
      value: stats.totalAssets,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Available",
      value: stats.availableAssets,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Assigned",
      value: stats.assignedAssets,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Under Repair",
      value: stats.underRepairAssets,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

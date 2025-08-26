"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Asset, Department } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Mail, Building2, Calendar, Package, Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"

interface EmployeeProfileProps {
  employee: Profile & { department?: Department }
  currentUser: Profile
}

const roleColors = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  it_staff: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

const statusColors = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  under_repair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  retired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function EmployeeProfile({ employee, currentUser }: EmployeeProfileProps) {
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignedAssets()
  }, [employee.id])

  const fetchAssignedAssets = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        category:asset_categories(id, name),
        department:departments(id, name)
      `)
      .eq("assigned_to", employee.id)
      .order("assigned_date", { ascending: false })

    if (error) {
      console.error("Error fetching assigned assets:", error)
    } else {
      setAssignedAssets(data || [])
    }
    setLoading(false)
  }

  const canEdit = currentUser.role === "admin" || currentUser.id === employee.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Link>
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {employee.first_name && employee.last_name
                    ? `${employee.first_name[0]}${employee.last_name[0]}`
                    : employee.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {employee.first_name && employee.last_name
                      ? `${employee.first_name} ${employee.last_name}`
                      : employee.email}
                  </h1>
                  <Badge className={roleColors[employee.role]}>{employee.role.replace("_", " ")}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {employee.email}
                  </div>

                  {employee.department && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {employee.department.name}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDistanceToNow(new Date(employee.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>

            {canEdit && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/employees/${employee.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Assigned Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Assigned Assets ({assignedAssets.length})
          </CardTitle>
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
          ) : assignedAssets.length > 0 ? (
            <div className="space-y-4">
              {assignedAssets.map((asset) => (
                <div key={asset.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{asset.name}</h4>
                        <Badge className={statusColors[asset.status]}>{asset.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Asset Tag: {asset.asset_tag}</span>
                        {asset.category && <span>Category: {asset.category.name}</span>}
                        {asset.brand && asset.model && (
                          <span>
                            {asset.brand} {asset.model}
                          </span>
                        )}
                      </div>
                      {asset.assigned_date && (
                        <p className="text-xs text-muted-foreground">
                          Assigned {format(new Date(asset.assigned_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/assets/${asset.id}`}>
                        <Package className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets assigned</h3>
              <p className="text-muted-foreground">This employee doesn't have any assets assigned yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

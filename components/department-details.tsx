"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Department, Profile, Asset } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Package, Calendar, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DepartmentDetailsProps {
  department: Department
  currentUser: Profile
}

interface DepartmentEmployee extends Profile {
  asset_count?: number
}

export function DepartmentDetails({ department, currentUser }: DepartmentDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDepartmentData()
  }, [department.id])

  const fetchDepartmentData = async () => {
    const supabase = createClient()

    // Get employees in this department
    const { data: employeesData } = await supabase
      .from("profiles")
      .select("*")
      .eq("department", department.id)
      .order("first_name", { ascending: true })

    // Get assets in this department
    const { data: assetsData } = await supabase
      .from("assets")
      .select(`
        *,
        category:asset_categories(name),
        assignee:profiles(first_name, last_name, email)
      `)
      .eq("department_id", department.id)
      .order("name", { ascending: true })

    // Count assets per employee
    const assetCounts = (assetsData || []).reduce(
      (acc, asset) => {
        if (asset.assigned_to) {
          acc[asset.assigned_to] = (acc[asset.assigned_to] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const employeesWithAssets = (employeesData || []).map((employee) => ({
      ...employee,
      asset_count: assetCounts[employee.id] || 0,
    }))

    setEmployees(employeesWithAssets)
    setAssets(assetsData || [])
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const supabase = createClient()

      // Check if department has employees or assets
      if (employees.length > 0 || assets.length > 0) {
        toast({
          title: "Cannot Delete Department",
          description: "Department must be empty before deletion. Please reassign all employees and assets first.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("departments").delete().eq("id", department.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Department deleted successfully",
      })

      router.push("/dashboard/departments")
    } catch (error) {
      console.error("Error deleting department:", error)
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = currentUser.role === "admin"

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Department Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{department.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(department.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {department.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{department.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{employees.length} employees</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{assets.length} assets</span>
            </div>
          </div>

          {canDelete && (
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Department
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Department</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{department.name}"? This action cannot be undone.
                      {(employees.length > 0 || assets.length > 0) && (
                        <span className="block mt-2 text-destructive font-medium">
                          This department has {employees.length} employees and {assets.length} assets. Please reassign
                          them first.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={employees.length > 0 || assets.length > 0}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employees ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length > 0 ? (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{employee.role}</Badge>
                    <span className="text-sm text-muted-foreground">{employee.asset_count} assets</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/employees/${employee.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No employees in this department</p>
          )}
        </CardContent>
      </Card>

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Assets ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length > 0 ? (
            <div className="space-y-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.asset_tag} • {asset.category?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        asset.status === "available"
                          ? "default"
                          : asset.status === "assigned"
                            ? "secondary"
                            : asset.status === "under_repair"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {asset.status.replace("_", " ")}
                    </Badge>
                    {asset.assignee && (
                      <span className="text-sm text-muted-foreground">
                        → {asset.assignee.first_name} {asset.assignee.last_name}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/assets/${asset.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No assets in this department</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Department } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Search, Users, Package, Edit, Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface DepartmentWithCounts extends Department {
  employee_count?: number
  asset_count?: number
}

export function DepartmentList() {
  const [departments, setDepartments] = useState<DepartmentWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    const supabase = createClient()

    // Get departments
    const { data: departmentsData, error } = await supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching departments:", error)
      setLoading(false)
      return
    }

    // Get employee counts
    const { data: employeeCounts } = await supabase.from("profiles").select("department").not("department", "is", null)

    // Get asset counts
    const { data: assetCounts } = await supabase.from("assets").select("department_id").not("department_id", "is", null)

    // Count employees per department
    const employeeCountMap = (employeeCounts || []).reduce(
      (acc, profile) => {
        if (profile.department) {
          acc[profile.department] = (acc[profile.department] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Count assets per department
    const assetCountMap = (assetCounts || []).reduce(
      (acc, asset) => {
        if (asset.department_id) {
          acc[asset.department_id] = (acc[asset.department_id] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Combine data
    const departmentsWithCounts = (departmentsData || []).map((department) => ({
      ...department,
      employee_count: employeeCountMap[department.id] || 0,
      asset_count: assetCountMap[department.id] || 0,
    }))

    setDepartments(departmentsWithCounts)
    setLoading(false)
  }

  const filteredDepartments = departments.filter(
    (department) =>
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Departments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredDepartments.length} of {departments.length} departments
        </p>
      </div>

      {/* Department Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(department.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/departments/${department.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/departments/${department.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {department.description && <p className="text-sm text-muted-foreground">{department.description}</p>}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{department.employee_count || 0} employees</span>
                </div>

                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{department.asset_count || 0} assets</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDepartments.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No departments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search to see more results."
                    : "Get started by creating your first department."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

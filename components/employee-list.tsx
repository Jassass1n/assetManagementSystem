"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Department } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Filter, Eye, Edit, Users, Mail, Building2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

const roleColors = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  it_staff: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

interface EmployeeWithDepartment extends Profile {
  department?: Department
  assigned_assets_count?: number
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<EmployeeWithDepartment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchEmployees = async () => {
    const supabase = createClient()

    // Get employees with their departments and asset counts
    const { data: employeesData, error } = await supabase
      .from("profiles")
      .select(`
        *,
        department:departments(id, name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching employees:", error)
      setLoading(false)
      return
    }

    // Get asset counts for each employee
    const employeeIds = employeesData?.map((emp) => emp.id) || []
    const { data: assetCounts } = await supabase
      .from("assets")
      .select("assigned_to")
      .in("assigned_to", employeeIds)
      .not("assigned_to", "is", null)

    // Count assets per employee
    const assetCountMap = (assetCounts || []).reduce(
      (acc, asset) => {
        if (asset.assigned_to) {
          acc[asset.assigned_to] = (acc[asset.assigned_to] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Combine data
    const employeesWithCounts = (employeesData || []).map((employee) => ({
      ...employee,
      assigned_assets_count: assetCountMap[employee.id] || 0,
    }))

    setEmployees(employeesWithCounts)
    setLoading(false)
  }

  const fetchDepartments = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("departments").select("*").order("name")

    setDepartments(data || [])
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || employee.role === roleFilter
    const matchesDepartment = departmentFilter === "all" || employee.department?.id === departmentFilter

    return matchesSearch && matchesRole && matchesDepartment
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="it_staff">IT Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      {/* Employee Cards */}
      <div className="space-y-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {employee.first_name && employee.last_name
                        ? `${employee.first_name[0]}${employee.last_name[0]}`
                        : employee.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {employee.first_name && employee.last_name
                          ? `${employee.first_name} ${employee.last_name}`
                          : employee.email}
                      </h3>
                      <Badge className={roleColors[employee.role]}>{employee.role.replace("_", " ")}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{employee.email}</span>
                      </div>

                      {employee.department && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.department.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{employee.assigned_assets_count || 0} assets assigned</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="ml-2">
                          {formatDistanceToNow(new Date(employee.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/employees/${employee.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/employees/${employee.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredEmployees.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== "all" || departmentFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by inviting your first employee."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

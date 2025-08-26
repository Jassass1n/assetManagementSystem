"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Asset, AssetCategory, Department } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExportDialog } from "@/components/export-dialog"
import { Search, Filter, Eye, Edit, Package, Download } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

const statusColors = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  under_repair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  retired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  useEffect(() => {
    fetchAssets()
    fetchCategories()
    fetchDepartments()
  }, [])

  const fetchAssets = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        category:asset_categories(id, name),
        assignee:profiles!assets_assigned_to_fkey(id, first_name, last_name, email),
        department:departments(id, name),
        creator:profiles!assets_created_by_fkey(id, first_name, last_name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching assets:", error)
    } else {
      setAssets(data || [])
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("asset_categories").select("*").order("name")

    setCategories(data || [])
  }

  const fetchDepartments = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("departments").select("*").order("name")

    setDepartments(data || [])
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    const matchesCategory = categoryFilter === "all" || asset.category_id === categoryFilter
    const matchesDepartment = departmentFilter === "all" || asset.department_id === departmentFilter

    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <ExportDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="under_repair">Under Repair</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
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
          Showing {filteredAssets.length} of {assets.length} assets
        </p>
      </div>

      {/* Asset Cards */}
      <div className="space-y-4">
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{asset.name}</h3>
                    <Badge className={statusColors[asset.status]}>{asset.status.replace("_", " ")}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Asset Tag:</span>
                      <p className="font-medium">{asset.asset_tag}</p>
                    </div>

                    {asset.brand && asset.model && (
                      <div>
                        <span className="text-muted-foreground">Brand/Model:</span>
                        <p className="font-medium">
                          {asset.brand} {asset.model}
                        </p>
                      </div>
                    )}

                    {asset.category && (
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{asset.category.name}</p>
                      </div>
                    )}

                    {asset.assignee && (
                      <div>
                        <span className="text-muted-foreground">Assigned to:</span>
                        <p className="font-medium">
                          {asset.assignee.first_name && asset.assignee.last_name
                            ? `${asset.assignee.first_name} ${asset.assignee.last_name}`
                            : asset.assignee.email}
                        </p>
                      </div>
                    )}

                    {asset.department && (
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <p className="font-medium">{asset.department.name}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/assets/${asset.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/assets/${asset.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAssets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || departmentFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by adding your first asset."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

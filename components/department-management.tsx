"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Department } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Building2, Users, Package } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DepartmentWithCounts extends Department {
  employee_count?: number
  asset_count?: number
}

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<DepartmentWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()

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

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("departments").insert({
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim() || null,
      })

      if (error) throw error

      toast({
        title: "Department added successfully",
        description: "The new department has been created.",
      })

      setAddDialogOpen(false)
      setNewDepartment({ name: "", description: "" })
      fetchDepartments()
    } catch (error) {
      console.error("Error adding department:", error)
      toast({
        title: "Error",
        description: "Failed to add department. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("departments")
        .update({
          name: editingDepartment.name.trim(),
          description: editingDepartment.description?.trim() || null,
        })
        .eq("id", editingDepartment.id)

      if (error) throw error

      toast({
        title: "Department updated successfully",
        description: "The department has been updated.",
      })

      setEditDialogOpen(false)
      setEditingDepartment(null)
      fetchDepartments()
    } catch (error) {
      console.error("Error updating department:", error)
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("departments").delete().eq("id", departmentId)

      if (error) throw error

      toast({
        title: "Department deleted successfully",
        description: "The department has been removed.",
      })

      fetchDepartments()
    } catch (error) {
      console.error("Error deleting department:", error)
      toast({
        title: "Error",
        description: "Failed to delete department. It may be in use by existing users or assets.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Department Management</CardTitle>
              <CardDescription>Manage organizational departments and structure</CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Department</DialogTitle>
                  <DialogDescription>Create a new organizational department</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      placeholder="e.g., Information Technology, Human Resources"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                      placeholder="Brief description of this department"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDepartment} disabled={!newDepartment.name.trim()}>
                    Add Department
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id} className="hover:shadow-sm transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{department.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingDepartment(department)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                        <DialogDescription>Update the department information</DialogDescription>
                      </DialogHeader>

                      {editingDepartment && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="editName">Department Name</Label>
                            <Input
                              id="editName"
                              value={editingDepartment.name}
                              onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="editDescription">Description</Label>
                            <Textarea
                              id="editDescription"
                              value={editingDepartment.description || ""}
                              onChange={(e) =>
                                setEditingDepartment({ ...editingDepartment, description: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateDepartment}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="sm" onClick={() => handleDeleteDepartment(department.id)}>
                    <Trash2 className="h-4 w-4" />
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

              <p className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(department.created_at), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No departments found</h3>
            <p className="text-muted-foreground">Get started by creating your first department.</p>
          </div>
        )}
      </div>
    </div>
  )
}

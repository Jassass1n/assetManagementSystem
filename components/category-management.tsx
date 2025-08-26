"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AssetCategory } from "@/lib/types"
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
import { Plus, Edit, Trash2, Tags } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function CategoryManagement() {
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const supabase = createClient()

    const { data, error } = await supabase.from("asset_categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("asset_categories").insert({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || null,
      })

      if (error) throw error

      toast({
        title: "Category added successfully",
        description: "The new asset category has been created.",
      })

      setAddDialogOpen(false)
      setNewCategory({ name: "", description: "" })
      fetchCategories()
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("asset_categories")
        .update({
          name: editingCategory.name.trim(),
          description: editingCategory.description?.trim() || null,
        })
        .eq("id", editingCategory.id)

      if (error) throw error

      toast({
        title: "Category updated successfully",
        description: "The asset category has been updated.",
      })

      setEditDialogOpen(false)
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("asset_categories").delete().eq("id", categoryId)

      if (error) throw error

      toast({
        title: "Category deleted successfully",
        description: "The asset category has been removed.",
      })

      fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use by existing assets.",
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
              <CardTitle>Asset Categories</CardTitle>
              <CardDescription>Manage asset categories and classifications</CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>Create a new asset category for classification</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Laptops, Monitors, Printers"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Brief description of this category"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory} disabled={!newCategory.name.trim()}>
                    Add Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-sm transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>Update the asset category information</DialogDescription>
                      </DialogHeader>

                      {editingCategory && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="editName">Category Name</Label>
                            <Input
                              id="editName"
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="editDescription">Description</Label>
                            <Textarea
                              id="editDescription"
                              value={editingCategory.description || ""}
                              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateCategory}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {category.description && <p className="text-sm text-muted-foreground mb-3">{category.description}</p>}
              <p className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(category.created_at), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground">Get started by creating your first asset category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { logAuditEvent } from "@/lib/audit-logger"
import type { Asset, AssetCategory, Department, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface AssetFormProps {
  asset?: Asset & {
    category?: AssetCategory
    assignee?: Profile
    department?: Department
  }
}

export function AssetForm({ asset }: AssetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])

  const [formData, setFormData] = useState({
    name: asset?.name || "",
    asset_tag: asset?.asset_tag || "",
    brand: asset?.brand || "",
    model: asset?.model || "",
    serial_number: asset?.serial_number || "",
    category_id: asset?.category_id || "none",
    department_id: asset?.department_id || "none",
    assigned_to: asset?.assigned_to || "none",
    status: asset?.status || "available",
    purchase_date: asset?.purchase_date || "",
    purchase_cost: asset?.purchase_cost?.toString() || "",
    warranty_expiry: asset?.warranty_expiry || "",
    location: asset?.location || "",
    notes: asset?.notes || "",
  })

  useEffect(() => {
    fetchCategories()
    fetchDepartments()
    fetchEmployees()
  }, [])

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

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("profiles").select("*").order("first_name")
    setEmployees(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        })
        return
      }

      const assetData = {
        name: formData.name,
        asset_tag: formData.asset_tag,
        brand: formData.brand || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        category_id: formData.category_id === "none" ? null : formData.category_id,
        department_id: formData.department_id === "none" ? null : formData.department_id,
        assigned_to: formData.assigned_to === "none" ? null : formData.assigned_to,
        status: formData.status as Asset["status"],
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? Number.parseFloat(formData.purchase_cost) : null,
        warranty_expiry: formData.warranty_expiry || null,
        location: formData.location || null,
        notes: formData.notes || null,
      }

      if (asset) {
        // Update existing asset
        const { error } = await supabase.from("assets").update(assetData).eq("id", asset.id)

        if (error) throw error

        // Log audit event
        await logAuditEvent({
          asset_id: asset.id,
          action: "updated",
          details: `Asset updated: ${formData.name}`,
          performed_by: user.id,
        })

        toast({
          title: "Success",
          description: "Asset updated successfully",
        })
      } else {
        // Create new asset
        const { data: newAsset, error } = await supabase
          .from("assets")
          .insert({ ...assetData, created_by: user.id })
          .select()
          .single()

        if (error) throw error

        // Log audit event
        await logAuditEvent({
          asset_id: newAsset.id,
          action: "created",
          details: `Asset created: ${formData.name}`,
          performed_by: user.id,
        })

        toast({
          title: "Success",
          description: "Asset created successfully",
        })
      }

      router.push("/dashboard/assets")
    } catch (error) {
      console.error("Error saving asset:", error)
      toast({
        title: "Error",
        description: "Failed to save asset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/assets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_tag">Asset Tag *</Label>
              <Input
                id="asset_tag"
                value={formData.asset_tag}
                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name && employee.last_name
                        ? `${employee.first_name} ${employee.last_name}`
                        : employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_cost">Purchase Cost</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : asset ? "Update Asset" : "Create Asset"}
        </Button>
      </div>
    </form>
  )
}

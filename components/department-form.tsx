"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Department } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Building2 } from "lucide-react"

interface DepartmentFormProps {
  mode: "create" | "edit"
  department?: Department
}

export function DepartmentForm({ mode, department }: DepartmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: department?.name || "",
    description: department?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      if (mode === "create") {
        const { error } = await supabase.from("departments").insert([
          {
            name: formData.name,
            description: formData.description || null,
          },
        ])

        if (error) throw error

        toast({
          title: "Success",
          description: "Department created successfully",
        })

        router.push("/dashboard/departments")
      } else {
        const { error } = await supabase
          .from("departments")
          .update({
            name: formData.name,
            description: formData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", department!.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Department updated successfully",
        })

        router.push(`/dashboard/departments/${department!.id}`)
      }
    } catch (error) {
      console.error("Error saving department:", error)
      toast({
        title: "Error",
        description: "Failed to save department. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {mode === "create" ? "Create Department" : "Edit Department"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Information Technology"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the department's role and responsibilities"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Department" : "Update Department"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (mode === "edit" && department) {
                  router.push(`/dashboard/departments/${department.id}`)
                } else {
                  router.push("/dashboard/departments")
                }
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

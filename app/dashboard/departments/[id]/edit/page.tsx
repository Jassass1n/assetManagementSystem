import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentForm } from "@/components/department-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EditDepartmentPageProps {
  params: {
    id: string
  }
}

export default async function EditDepartmentPage({ params }: EditDepartmentPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Only admins can edit departments
  if (profile.role !== "admin") {
    redirect(`/dashboard/departments/${params.id}`)
  }

  // Get department details
  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("*")
    .eq("id", params.id)
    .single()

  if (departmentError || !department) {
    notFound()
  }

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/departments/${department.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Department
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Department</h1>
          <p className="text-muted-foreground">Update department information</p>
        </div>

        <DepartmentForm mode="edit" department={department} />
      </div>
    </DashboardLayout>
  )
}

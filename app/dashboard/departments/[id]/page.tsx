import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentDetails } from "@/components/department-details"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DepartmentPageProps {
  params: {
    id: string
  }
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  if (params.id === "new") {
    redirect("/dashboard/departments/new")
  }

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

  // Get department details
  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("*")
    .eq("id", params.id)
    .single()

  if (departmentError || !department) {
    notFound()
  }

  const canEdit = profile.role === "admin"

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/departments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Departments
              </Link>
            </Button>
          </div>

          {canEdit && (
            <Button asChild>
              <Link href={`/dashboard/departments/${department.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Department
              </Link>
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
          <p className="text-muted-foreground">Department details and management</p>
        </div>

        <DepartmentDetails department={department} currentUser={profile} />
      </div>
    </DashboardLayout>
  )
}

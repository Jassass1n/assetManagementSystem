import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentForm } from "@/components/department-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewDepartmentPage() {
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

  // Only admins can create departments
  if (profile.role !== "admin") {
    redirect("/dashboard/departments")
  }

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/departments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Departments
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Department</h1>
          <p className="text-muted-foreground">Add a new department to your organization</p>
        </div>

        <DepartmentForm mode="create" />
      </div>
    </DashboardLayout>
  )
}

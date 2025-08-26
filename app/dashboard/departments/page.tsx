import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentList } from "@/components/department-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function DepartmentsPage() {
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

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground">Manage organizational departments</p>
          </div>
          {profile.role === "admin" && (
            <Button asChild>
              <Link href="/dashboard/departments/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Link>
            </Button>
          )}
        </div>

        <DepartmentList />
      </div>
    </DashboardLayout>
  )
}

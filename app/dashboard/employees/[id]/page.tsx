import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EmployeeProfile } from "@/components/employee-profile"

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get current user profile
  const { data: currentProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!currentProfile) {
    redirect("/auth/login")
  }

  // Get employee profile
  const { data: employee, error: employeeError } = await supabase
    .from("profiles")
    .select(`
      *,
      department:departments(id, name)
    `)
    .eq("id", id)
    .single()

  if (employeeError || !employee) {
    notFound()
  }

  return (
    <DashboardLayout user={currentProfile}>
      <EmployeeProfile employee={employee} currentUser={currentProfile} />
    </DashboardLayout>
  )
}

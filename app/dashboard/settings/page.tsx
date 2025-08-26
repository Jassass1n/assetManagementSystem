import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminSettings } from "@/components/admin-settings"

export default async function SettingsPage() {
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

  // Check if user is admin
  if (profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and administrative settings</p>
        </div>

        <AdminSettings />
      </div>
    </DashboardLayout>
  )
}

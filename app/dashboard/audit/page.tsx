import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuditLogList } from "@/components/audit-log-list"

export default async function AuditPage() {
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

  // Check if user has permission to view audit logs
  if (!["admin", "it_staff"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground">Track all asset changes and system activities</p>
        </div>

        <AuditLogList />
      </div>
    </DashboardLayout>
  )
}

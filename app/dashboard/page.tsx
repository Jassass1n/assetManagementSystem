import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AssetOverview } from "@/components/asset-overview"
import { RecentActivity } from "@/components/recent-activity"
import { QuickStats } from "@/components/quick-stats"

export default async function DashboardPage() {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.first_name || profile.email}</p>
        </div>

        <QuickStats />

        <div className="grid gap-6 md:grid-cols-2">
          <AssetOverview />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  )
}

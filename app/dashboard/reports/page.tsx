import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ReportsOverview } from "@/components/reports-overview"
import { ExportDialog } from "@/components/export-dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default async function ReportsPage() {
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

  // Check if user has permission to view reports
  if (!["admin", "it_staff"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate reports and export data for analysis</p>
          </div>
          <ExportDialog
            trigger={
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            }
          />
        </div>

        <ReportsOverview />
      </div>
    </DashboardLayout>
  )
}

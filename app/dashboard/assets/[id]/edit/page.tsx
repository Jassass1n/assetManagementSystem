import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AssetForm } from "@/components/asset-form"

interface EditAssetPageProps {
  params: {
    id: string
  }
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
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

  // Check permissions
  if (profile.role !== "admin" && profile.role !== "it_staff") {
    redirect("/dashboard/assets")
  }

  // Get asset details
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select(`
      *,
      category:asset_categories(id, name),
      assignee:profiles!assets_assigned_to_fkey(id, first_name, last_name, email),
      department:departments(id, name)
    `)
    .eq("id", params.id)
    .single()

  if (assetError || !asset) {
    notFound()
  }

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          <p className="text-muted-foreground">Update asset information</p>
        </div>

        <AssetForm asset={asset} />
      </div>
    </DashboardLayout>
  )
}

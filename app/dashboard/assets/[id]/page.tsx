import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AssetDetails } from "@/components/asset-details"

interface AssetPageProps {
  params: {
    id: string
  }
}

export default async function AssetPage({ params }: AssetPageProps) {
  if (params.id === "new") {
    redirect("/dashboard/assets/new")
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

  // Get asset details
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select(`
      *,
      category:asset_categories(id, name),
      assignee:profiles!assets_assigned_to_fkey(id, first_name, last_name, email),
      department:departments(id, name),
      creator:profiles!assets_created_by_fkey(id, first_name, last_name, email)
    `)
    .eq("id", params.id)
    .single()

  if (assetError || !asset) {
    notFound()
  }

  return (
    <DashboardLayout user={profile}>
      <AssetDetails asset={asset} userProfile={profile} />
    </DashboardLayout>
  )
}

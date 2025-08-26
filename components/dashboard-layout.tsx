"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Menu,
  LogOut,
  Building2,
  FileText,
  Shield,
  Activity,
} from "lucide-react"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getRoleDisplayName } from "@/lib/auth-utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: Profile
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "it_staff", "viewer"] },
  { name: "Assets", href: "/dashboard/assets", icon: Package, roles: ["admin", "it_staff", "viewer"] },
  { name: "Employees", href: "/dashboard/employees", icon: Users, roles: ["admin", "it_staff", "viewer"] },
  { name: "Departments", href: "/dashboard/departments", icon: Building2, roles: ["admin", "it_staff", "viewer"] },
  { name: "Audit Trail", href: "/dashboard/audit", icon: Activity, roles: ["admin", "it_staff"] },
  { name: "Reports", href: "/dashboard/reports", icon: FileText, roles: ["admin", "it_staff"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
]

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => item.roles.includes(user.role))

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-semibold">IT Asset Manager</h2>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">{user.first_name?.[0] || user.email[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center gap-4 border-b px-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold">IT Asset Manager</h2>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

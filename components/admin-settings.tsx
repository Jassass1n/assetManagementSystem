"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/user-management"
import { CategoryManagement } from "@/components/category-management"
import { DepartmentManagement } from "@/components/department-management"
import { SystemStats } from "@/components/system-stats"
import { SystemMaintenance } from "@/components/system-maintenance"
import { Users, Building2, Tags, BarChart3, Settings, Shield } from "lucide-react"

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemStats />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="maintenance">
          <SystemMaintenance />
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Row Level Security</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Database security is enforced through Row Level Security (RLS) policies
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">RLS Enabled</span>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    User authentication is handled by Supabase Auth with email verification
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Email Verification Required</span>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Role-Based Access</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Access controls are enforced based on user roles (Admin, IT Staff, Viewer)
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">RBAC Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

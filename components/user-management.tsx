"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Department } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Search, Edit, Shield, Mail, Building2, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const roleColors = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  it_staff: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

interface UserWithDepartment extends Profile {
  department?: Department
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithDepartment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<UserWithDepartment | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  const fetchUsers = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        department:departments(id, name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const fetchDepartments = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("departments").select("*").order("name")
    setDepartments(data || [])
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    const supabase = createClient()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          role: editingUser.role,
          department: editingUser.department?.id || null,
        })
        .eq("id", editingUser.id)

      if (error) throw error

      toast({
        title: "User updated successfully",
        description: "The user's information has been updated.",
      })

      setEditDialogOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {user.first_name && user.last_name
                            ? `${user.first_name[0]}${user.last_name[0]}`
                            : user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                          </h4>
                          <Badge className={roleColors[user.role]}>{user.role.replace("_", " ")}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>

                          {user.department && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {user.department.name}
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                          <DialogDescription>Update user information and permissions</DialogDescription>
                        </DialogHeader>

                        {editingUser && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                  id="firstName"
                                  value={editingUser.first_name || ""}
                                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                  id="lastName"
                                  value={editingUser.last_name || ""}
                                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="role">Role</Label>
                              <Select
                                value={editingUser.role}
                                onValueChange={(value: any) => setEditingUser({ ...editingUser, role: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="it_staff">IT Staff</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="department">Department</Label>
                              <Select
                                value={editingUser.department?.id || ""}
                                onValueChange={(value) => {
                                  const dept = departments.find((d) => d.id === value)
                                  setEditingUser({ ...editingUser, department: dept })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No Department</SelectItem>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateUser}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms." : "No users are registered in the system."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

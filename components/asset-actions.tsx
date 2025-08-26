"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { auditLogger } from "@/lib/audit-logger"
import type { Asset, Profile } from "@/lib/types"
import { UserCheck, UserX, Settings } from "lucide-react"

interface AssetActionsProps {
  asset: Asset
  currentUser: Profile
  employees: Profile[]
  onAssetUpdated: () => void
}

const statusColors = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  under_repair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  retired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function AssetActions({ asset, currentUser, employees, onAssetUpdated }: AssetActionsProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>(asset.status)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const canManageAssets = ["admin", "it_staff"].includes(currentUser.role)

  const handleAssignAsset = async () => {
    if (!selectedEmployee || !canManageAssets) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const oldAssignee = asset.assigned_to
      const { error } = await supabase
        .from("assets")
        .update({
          assigned_to: selectedEmployee,
          assigned_date: new Date().toISOString(),
          status: "assigned",
        })
        .eq("id", asset.id)

      if (error) throw error

      // Log the assignment
      await auditLogger.logAssetAssigned(asset.id, selectedEmployee, currentUser.id, oldAssignee, notes)

      toast({
        title: "Asset assigned successfully",
        description: "The asset has been assigned to the selected employee.",
      })

      setAssignDialogOpen(false)
      setSelectedEmployee("")
      setNotes("")
      onAssetUpdated()
    } catch (error) {
      console.error("Error assigning asset:", error)
      toast({
        title: "Error",
        description: "Failed to assign asset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassignAsset = async () => {
    if (!asset.assigned_to || !canManageAssets) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("assets")
        .update({
          assigned_to: null,
          assigned_date: null,
          status: "available",
        })
        .eq("id", asset.id)

      if (error) throw error

      // Log the unassignment
      await auditLogger.logAssetUnassigned(asset.id, asset.assigned_to, currentUser.id, notes)

      toast({
        title: "Asset unassigned successfully",
        description: "The asset is now available for assignment.",
      })

      setNotes("")
      onAssetUpdated()
    } catch (error) {
      console.error("Error unassigning asset:", error)
      toast({
        title: "Error",
        description: "Failed to unassign asset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (selectedStatus === asset.status || !canManageAssets) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("assets").update({ status: selectedStatus }).eq("id", asset.id)

      if (error) throw error

      // Log the status change
      await auditLogger.logStatusChange(asset.id, asset.status, selectedStatus, currentUser.id, notes)

      toast({
        title: "Status updated successfully",
        description: `Asset status changed to ${selectedStatus.replace("_", " ")}.`,
      })

      setStatusDialogOpen(false)
      setNotes("")
      onAssetUpdated()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update asset status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!canManageAssets) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={statusColors[asset.status]}>{asset.status.replace("_", " ")}</Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={statusColors[asset.status]}>{asset.status.replace("_", " ")}</Badge>

      {/* Assign/Unassign Asset */}
      {asset.status !== "retired" && (
        <>
          {!asset.assigned_to ? (
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Asset</DialogTitle>
                  <DialogDescription>Select an employee to assign this asset to.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.first_name && employee.last_name
                              ? `${employee.first_name} ${employee.last_name}`
                              : employee.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this assignment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignAsset} disabled={!selectedEmployee || isLoading}>
                    {isLoading ? "Assigning..." : "Assign Asset"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserX className="h-4 w-4 mr-2" />
                  Unassign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unassign Asset</DialogTitle>
                  <DialogDescription>
                    This will unassign the asset and make it available for reassignment.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="unassign-notes">Notes (optional)</Label>
                    <Textarea
                      id="unassign-notes"
                      placeholder="Add any notes about this unassignment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setNotes("")}>
                    Cancel
                  </Button>
                  <Button onClick={handleUnassignAsset} disabled={isLoading}>
                    {isLoading ? "Unassigning..." : "Unassign Asset"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      {/* Change Status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Status
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Asset Status</DialogTitle>
            <DialogDescription>Update the current status of this asset.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-notes">Notes (optional)</Label>
              <Textarea
                id="status-notes"
                placeholder="Add any notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={selectedStatus === asset.status || isLoading}>
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

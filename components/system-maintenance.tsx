"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Download, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Import useToast hook

export function SystemMaintenance() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast() // Declare useToast hook

  const handleDatabaseBackup = async () => {
    setIsLoading(true)
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Backup completed",
        description: "Database backup has been created successfully.",
      })
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "There was an error creating the backup.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAuditLogs = async () => {
    if (!confirm("Are you sure you want to clear old audit logs? This action cannot be undone.")) return

    setIsLoading(true)
    try {
      // Simulate cleanup process
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({
        title: "Audit logs cleaned",
        description: "Old audit logs have been removed successfully.",
      })
    } catch (error) {
      toast({
        title: "Cleanup failed",
        description: "There was an error cleaning up audit logs.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSystemRefresh = async () => {
    setIsLoading(true)
    try {
      // Simulate refresh process
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "System refreshed",
        description: "System cache has been cleared and refreshed.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was an error refreshing the system.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These maintenance operations should be performed during low-usage periods. Always ensure you have recent
          backups before performing any destructive operations.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Operations
            </CardTitle>
            <CardDescription>Manage database backups and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Create Backup</h4>
                  <p className="text-sm text-muted-foreground">Export a complete database backup</p>
                </div>
                <Button onClick={handleDatabaseBackup} disabled={isLoading} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Backup
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Database Status</h4>
                  <p className="text-sm text-muted-foreground">Current database health</p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Row Level Security</h4>
                  <p className="text-sm text-muted-foreground">Database security status</p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Operations */}
        <Card>
          <CardHeader>
            <CardTitle>System Operations</CardTitle>
            <CardDescription>Perform system maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Clear Cache</h4>
                  <p className="text-sm text-muted-foreground">Refresh system cache and data</p>
                </div>
                <Button onClick={handleSystemRefresh} disabled={isLoading} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Clean Audit Logs</h4>
                  <p className="text-sm text-muted-foreground">Remove logs older than 90 days</p>
                </div>
                <Button onClick={handleClearAuditLogs} disabled={isLoading} variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Clean
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">System Uptime</h4>
                  <p className="text-sm text-muted-foreground">Current system availability</p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  99.9%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">156</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2.3GB</div>
              <div className="text-sm text-muted-foreground">Database Size</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

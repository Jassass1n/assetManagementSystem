"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AuditLog, Asset, Profile } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, ChevronDown, ChevronRight, Activity, Eye, Calendar } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface AuditLogWithDetails extends AuditLog {
  asset?: Asset
  performer?: Profile
}

const actionColors = {
  created: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  updated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  assigned: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  unassigned: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  status_changed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function AuditLogList() {
  const [auditLogs, setAuditLogs] = useState<AuditLogWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        asset:assets(id, name, asset_tag),
        performer:profiles!audit_logs_performed_by_fkey(id, first_name, last_name, email)
      `)
      .order("performed_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("Error fetching audit logs:", error)
    } else {
      setAuditLogs(data || [])
    }
    setLoading(false)
  }

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.asset?.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || log.action === actionFilter

    let matchesDate = true
    if (dateFilter !== "all") {
      const logDate = new Date(log.performed_at)
      const now = new Date()
      switch (dateFilter) {
        case "today":
          matchesDate = logDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = logDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = logDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesAction && matchesDate
  })

  const renderValueChange = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null

    const changes = []

    if (oldValues && newValues) {
      // Show what changed
      Object.keys(newValues).forEach((key) => {
        if (oldValues[key] !== newValues[key]) {
          changes.push(
            <div key={key} className="text-xs">
              <span className="font-medium">{key}:</span>
              <span className="text-red-600 line-through ml-1">{oldValues[key] || "null"}</span>
              <span className="mx-1">→</span>
              <span className="text-green-600">{newValues[key] || "null"}</span>
            </div>,
          )
        }
      })
    } else if (newValues) {
      // Show new values (creation)
      Object.entries(newValues).forEach(([key, value]) => {
        if (value) {
          changes.push(
            <div key={key} className="text-xs">
              <span className="font-medium">{key}:</span>
              <span className="text-green-600 ml-1">{String(value)}</span>
            </div>,
          )
        }
      })
    } else if (oldValues) {
      // Show old values (deletion)
      Object.entries(oldValues).forEach(([key, value]) => {
        if (value) {
          changes.push(
            <div key={key} className="text-xs">
              <span className="font-medium">{key}:</span>
              <span className="text-red-600 line-through ml-1">{String(value)}</span>
            </div>,
          )
        }
      })
    }

    return changes.length > 0 ? <div className="space-y-1">{changes}</div> : null
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="status_changed">Status Changed</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {auditLogs.length} audit entries
        </p>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-sm transition-shadow">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardContent className="p-4 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {expandedLogs.has(log.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={actionColors[log.action as keyof typeof actionColors] || "bg-gray-100"}>
                            {log.action.replace("_", " ")}
                          </Badge>
                          <span className="font-medium">
                            {log.asset?.name || "Unknown Asset"} ({log.asset?.asset_tag || "N/A"})
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span>
                              by{" "}
                              {log.performer?.first_name && log.performer?.last_name
                                ? `${log.performer.first_name} ${log.performer.last_name}`
                                : log.performer?.email || "System"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(log.performed_at), { addSuffix: true })}</span>
                          </div>
                        </div>

                        {log.notes && <p className="text-sm text-muted-foreground italic">"{log.notes}"</p>}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(log.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 border-t bg-muted/20">
                  <div className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Timestamp:</span>
                        <p className="text-muted-foreground">{format(new Date(log.performed_at), "PPpp")}</p>
                      </div>

                      <div>
                        <span className="font-medium">Performed by:</span>
                        <p className="text-muted-foreground">
                          {log.performer?.first_name && log.performer?.last_name
                            ? `${log.performer.first_name} ${log.performer.last_name} (${log.performer.email})`
                            : log.performer?.email || "System"}
                        </p>
                      </div>
                    </div>

                    {(log.old_values || log.new_values) && (
                      <div>
                        <span className="font-medium">Changes:</span>
                        <div className="mt-2 p-3 bg-background rounded border">
                          {renderValueChange(log.old_values, log.new_values)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || actionFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Audit logs will appear here as assets are created and modified."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

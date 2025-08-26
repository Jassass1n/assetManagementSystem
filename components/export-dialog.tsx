"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { generateCSV } from "@/lib/export-utils"
import { Download, FileText, Table, Users, Activity, Building2 } from "lucide-react"

interface ExportDialogProps {
  trigger?: React.ReactNode
}

const exportTypes = [
  {
    value: "assets",
    label: "Assets",
    description: "Export all asset information including assignments and status",
    icon: Table,
  },
  {
    value: "employees",
    label: "Employees",
    description: "Export employee directory with roles and departments",
    icon: Users,
  },
  {
    value: "audit_logs",
    label: "Audit Logs",
    description: "Export audit trail and activity history",
    icon: Activity,
  },
  {
    value: "departments",
    label: "Departments",
    description: "Export department information and structure",
    icon: Building2,
  },
]

const exportFormats = [
  {
    value: "csv",
    label: "CSV",
    description: "Comma-separated values for spreadsheet applications",
    icon: Table,
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Formatted report document",
    icon: FileText,
  },
]

export function ExportDialog({ trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState<string>("")
  const [exportFormat, setExportFormat] = useState<string>("csv")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    if (!exportType) {
      toast({
        title: "Error",
        description: "Please select what to export",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: exportType,
          format: exportFormat,
          includeDetails,
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      if (exportFormat === "pdf") {
        // Handle PDF export
        const htmlContent = await response.text()
        const blob = new Blob([htmlContent], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${exportType}_export_${new Date().toISOString().split("T")[0]}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Handle CSV export
        const result = await response.json()
        generateCSV(result.data, result.filename)
      }

      toast({
        title: "Export successful",
        description: `${exportType} data has been exported successfully`,
      })

      setOpen(false)
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>Choose what data to export and in which format</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to export?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-colors ${
                    exportType === type.value ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setExportType(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <type.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-medium">{type.label}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <Card
                  key={format.value}
                  className={`cursor-pointer transition-colors ${
                    exportFormat === format.value ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setExportFormat(format.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <format.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-medium">{format.label}</h4>
                        <p className="text-sm text-muted-foreground">{format.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Export Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="includeDetails" checked={includeDetails} onCheckedChange={setIncludeDetails} />
              <Label htmlFor="includeDetails" className="text-sm">
                Include detailed information and relationships
              </Label>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={!exportType || isExporting}>
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

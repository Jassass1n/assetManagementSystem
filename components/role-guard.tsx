"use client"

import type React from "react"
import type { UserRole } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  userRole: UserRole
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, userRole, fallback }: RoleGuardProps) {
  if (!allowedRoles.includes(userRole)) {
    return (
      fallback || (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>You don't have permission to access this feature.</AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}

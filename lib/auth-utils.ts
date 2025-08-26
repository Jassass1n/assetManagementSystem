import type { UserRole } from "./types"

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

export function canManageAssets(userRole: UserRole): boolean {
  return hasPermission(userRole, ["admin", "it_staff"])
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, ["admin"])
}

export function canViewReports(userRole: UserRole): boolean {
  return hasPermission(userRole, ["admin", "it_staff"])
}

export function canExportData(userRole: UserRole): boolean {
  return hasPermission(userRole, ["admin", "it_staff"])
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrator"
    case "it_staff":
      return "IT Staff"
    case "viewer":
      return "Viewer"
    default:
      return "Unknown"
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Full access to all features including user management and system settings"
    case "it_staff":
      return "Can manage assets, view reports, and perform IT operations"
    case "viewer":
      return "Read-only access to view assets and basic information"
    default:
      return "No description available"
  }
}

import { useAuthStore } from '../store/auth'

export interface User {
  id: string
  username: string
  email: string
  name?: string
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'USER'
  isActive: boolean
}

export const usePermissions = () => {
  const { user } = useAuthStore()

  if (!user) {
    return {
      canViewAllUsers: false,
      canViewAllProjects: false,
      canViewAllIssues: false,
      canCreateUsers: false,
      canCreateProjects: false,
      canDeleteProjects: false,
      canManageProjectMembers: false,
      canAssignIssues: false,
      canEditIssues: false,
      canDeleteIssues: false,
      canCreateComments: false,
      isAdmin: false,
      isManager: false,
      isDeveloper: false,
      isRegularUser: false
    }
  }

  const isAdmin = user.role === 'ADMIN'
  const isManager = user.role === 'MANAGER'
  const isDeveloper = user.role === 'DEVELOPER'
  const isRegularUser = user.role === 'USER'

  return {
    // Global permissions
    canViewDashboard: isAdmin || isManager, // Only admins and managers can view dashboard
    canViewAllUsers: isAdmin || isManager,
    canViewAllProjects: isAdmin || isManager,
    canViewAllIssues: isAdmin || isManager,
    canViewKanbanBoard: isAdmin || isManager || isDeveloper, // Admins, managers and developers can view kanban board
    canViewProjectStats: isAdmin || isManager || isDeveloper, // Only admins, managers and developers can view project statistics
    canCreateUsers: isAdmin,
    canCreateProjects: isAdmin || isManager || isDeveloper, // Only admins, managers and developers can create projects
    canDeleteProjects: isAdmin || isManager, // Only admins and managers can delete projects
    
    // Project-specific permissions (will be checked per project)
    canManageProjectMembers: isAdmin || isManager, // Will be refined per project
    canAssignIssues: isAdmin || isManager, // Will be refined per project
    canEditIssues: isAdmin || isManager, // Will be refined per project
    canDeleteIssues: isAdmin || isManager, // Will be refined per project
    canCreateComments: true, // All authenticated users can comment
    
    // Role checks
    isAdmin,
    isManager,
    isDeveloper,
    isRegularUser
  }
}

// Project-specific permission hook
export const useProjectPermissions = (projectId?: string, projectOwnerId?: string, userRole?: string) => {
  const { user } = useAuthStore()
  const { isAdmin, isManager } = usePermissions()

  if (!user || !projectId) {
    return {
      canManageProject: false,
      canManageMembers: false,
      canAssignIssues: false,
      canEditIssues: false,
      canDeleteIssues: false,
      canDeleteProject: false,
      isProjectOwner: false,
      isProjectMaintainer: false
    }
  }

  const isProjectOwner = projectOwnerId === user.id
  const isProjectMaintainer = userRole === 'MAINTAINER'

  return {
    canManageProject: isAdmin || isManager || isProjectOwner || isProjectMaintainer,
    canManageMembers: isAdmin || isManager || isProjectOwner || isProjectMaintainer,
    canAssignIssues: isAdmin || isManager || isProjectOwner || isProjectMaintainer,
    canEditIssues: isAdmin || isManager || isProjectOwner || isProjectMaintainer,
    canDeleteIssues: isAdmin || isManager || isProjectOwner || isProjectMaintainer,
    canDeleteProject: isAdmin || isManager || isProjectOwner,
    isProjectOwner,
    isProjectMaintainer
  }
}

// Issue-specific permission hook
export const useIssuePermissions = (issueReporterId?: string, issueAssigneeId?: string) => {
  const { user } = useAuthStore()
  const { isAdmin, isManager } = usePermissions()

  if (!user || !issueReporterId) {
    return {
      canEditIssue: false,
      canDeleteIssue: false,
      canAssignIssue: false,
      isIssueReporter: false,
      isIssueAssignee: false
    }
  }

  const isIssueReporter = issueReporterId === user.id
  const isIssueAssignee = issueAssigneeId === user.id

  return {
    canEditIssue: isAdmin || isManager || isIssueReporter || isIssueAssignee,
    canDeleteIssue: isAdmin || isManager,
    canCloseIssue: isAdmin || isManager || isIssueReporter || isIssueAssignee,
    canAssignIssue: isAdmin || isManager,
    isIssueReporter,
    isIssueAssignee
  }
} 
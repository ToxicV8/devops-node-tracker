import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { usePermissions } from '@/hooks/usePermissions'

interface AdminRouteProps {
  children: ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated } = useAuthStore()
  const permissions = usePermissions()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!permissions.canViewAllUsers) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default AdminRoute 
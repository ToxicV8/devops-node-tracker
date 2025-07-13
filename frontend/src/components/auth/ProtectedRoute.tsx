import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { usePermissions } from '@/hooks/usePermissions'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: keyof ReturnType<typeof usePermissions>
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore()
  const permissions = usePermissions()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check specific permission if required
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute 
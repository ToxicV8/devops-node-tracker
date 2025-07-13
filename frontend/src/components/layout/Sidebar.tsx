import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderOpen, 
  AlertCircle, 
  Kanban,
  Users, 
  Settings,
  LogOut,
  X
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '@/hooks/usePermissions'

interface SidebarProps {
  onClose?: () => void
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const permissions = usePermissions()

  const navigation = [
    // Dashboard nur anzeigen, wenn User Berechtigung hat
    ...(permissions.canViewDashboard ? [{ name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard }] : []),
    { name: t('projects'), href: '/projects', icon: FolderOpen },
    { name: t('issues'), href: '/issues', icon: AlertCircle },
    // Kanban Board nur anzeigen, wenn User Berechtigung hat
    ...(permissions.canViewKanbanBoard ? [{ name: t('kanban_board'), href: '/kanban', icon: Kanban }] : []),
    // Users nur anzeigen, wenn User Berechtigung hat
    ...(permissions.canViewAllUsers ? [{ name: t('users'), href: '/users', icon: Users }] : []),
    { name: t('settings'), href: '/settings', icon: Settings },
  ]

  const handleNavClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      {/* Header mit exakt gleicher Struktur wie Header.tsx */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Issue Tracker</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {user?.name?.charAt(0) || user?.username?.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.name || user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="btn btn-ghost btn-md w-full justify-start"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  )
}

export default Sidebar 
import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => {
  const { t } = useTranslation()

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <Link
        to="/dashboard"
        className="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">{t('home')}</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.current ? (
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {item.label}
            </span>
          ) : item.href ? (
            <Link
              to={item.href}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumbs 
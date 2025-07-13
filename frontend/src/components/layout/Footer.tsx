import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, ExternalLink } from 'lucide-react'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'DevOps Node Tracker'
  const githubUrl = import.meta.env.VITE_GITHUB_URL || ''

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>© {currentYear} {companyName}. {t('all_rights_reserved')}</span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              {t('made_with')} <Heart className="h-4 w-4 text-red-500 mx-1" /> {t('in_germany')}
            </span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              to="/impressum" 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center"
            >
              {t('impressum')}
            </Link>
            <Link 
              to="/privacy" 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center"
            >
              {t('privacy_policy')}
            </Link>
            {githubUrl && (
              <a 
                href={githubUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center"
              >
                GitHub
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 
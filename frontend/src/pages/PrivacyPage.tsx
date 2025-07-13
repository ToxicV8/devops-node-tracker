import { useTranslation } from 'react-i18next'
import { Shield, Database, Mail, Phone, Building, User } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const PrivacyPage = () => {
  const { t } = useTranslation()

  // Umgebungsvariablen für Datenschutz-Daten
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'DevOps Node Tracker GmbH'
  const companyAddress = import.meta.env.VITE_COMPANY_ADDRESS || 'Musterstraße 123, 12345 Musterstadt'
  const companyEmail = import.meta.env.VITE_COMPANY_EMAIL || 'info@devops-tracker.com'
  const companyPhone = import.meta.env.VITE_COMPANY_PHONE || '+49 123 456789'
  const dpoName = import.meta.env.VITE_DPO_NAME || 'Max Mustermann'
  const dpoEmail = import.meta.env.VITE_DPO_EMAIL || 'datenschutz@devops-tracker.com'
  const dpoPhone = import.meta.env.VITE_DPO_PHONE || '+49 123 456789'
  const privacyPolicyDate = import.meta.env.VITE_PRIVACY_POLICY_DATE || '2024-01-01'
  // Currently not using cookies - localStorage only
  const useCookies = false // import.meta.env.VITE_USE_COOKIES === 'true'
  const useAnalytics = false // import.meta.env.VITE_USE_ANALYTICS === 'true'

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Breadcrumbs 
        items={[
          { label: t('privacy_policy'), current: true }
        ]} 
        className="mb-6"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center mb-6">
          <Shield className="h-8 w-8 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('privacy_policy')}
          </h1>
        </div>

        <div className="space-y-8">
          {/* Einleitung */}
          <section>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>{t('last_updated')}:</strong> {new Date(privacyPolicyDate).toLocaleDateString()}
              </p>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {t('privacy_intro_text', { company: companyName })}
            </p>
          </section>

          {/* Verantwortlicher */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              {t('data_controller')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start">
                <Building className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{companyName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{companyAddress}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('email')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{companyEmail}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('phone')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{companyPhone}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Datenschutzbeauftragter */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              {t('data_protection_officer')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{dpoName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('data_protection_officer_title')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('email')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{dpoEmail}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('phone')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{dpoPhone}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Erhobene Daten */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-purple-600" />
              {t('data_collection')}
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('personal_data')}
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('name_email_username')}</li>
                  <li>• {t('role_permissions')}</li>
                  <li>• {t('activity_logs')}</li>
                  <li>• {t('project_assignments')}</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('usage_data')}
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('access_times')}</li>
                  <li>• {t('feature_usage')}</li>
                  <li>• {t('error_logs')}</li>
                  <li>• {t('performance_metrics')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Zweck der Datenverarbeitung */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('purpose_of_processing')}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('purpose_text')}
              </p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                <li>• {t('user_management')}</li>
                <li>• {t('project_management')}</li>
                <li>• {t('issue_tracking')}</li>
                <li>• {t('communication')}</li>
                <li>• {t('system_improvement')}</li>
                <li>• {t('security_monitoring')}</li>
              </ul>
            </div>
          </section>

          {/* Rechtsgrundlage */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('legal_basis')}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal_basis_text')}
              </p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                <li>• <strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> {t('contract_fulfillment')}</li>
                <li>• <strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> {t('legitimate_interest')}</li>
                <li>• <strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> {t('consent')}</li>
              </ul>
            </div>
          </section>

          {/* Datenweitergabe */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('data_sharing')}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                {t('data_sharing_text')}
              </p>
            </div>
          </section>

          {/* Speicherdauer */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('retention_period')}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                {t('retention_period_text')}
              </p>
            </div>
          </section>

          {/* Cookies */}
          {useCookies && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('cookies')}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t('cookies_text')}
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t('essential_cookies')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('essential_cookies_text')}
                    </p>
                  </div>
                  {useAnalytics && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('analytics_cookies')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('analytics_cookies_text')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Ihre Rechte */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('your_rights')}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('access_rights')}
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('right_to_access')}</li>
                  <li>• {t('right_to_rectification')}</li>
                  <li>• {t('right_to_erasure')}</li>
                  <li>• {t('right_to_restriction')}</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('additional_rights')}
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('right_to_portability')}</li>
                  <li>• {t('right_to_object')}</li>
                  <li>• {t('right_to_withdraw')}</li>
                  <li>• {t('right_to_complain')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('contact_information')}
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200">
                {t('privacy_contact_text')} <strong>{dpoEmail}</strong>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage 
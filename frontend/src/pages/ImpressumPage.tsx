import { useTranslation } from 'react-i18next'
import { FileText, Mail, Phone, MapPin, Building, User, Calendar } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const ImpressumPage = () => {
  const { t } = useTranslation()

  // Umgebungsvariablen für Impressum-Daten
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'DevOps Node Tracker GmbH'
  const companyAddress = import.meta.env.VITE_COMPANY_ADDRESS || 'Musterstraße 123, 12345 Musterstadt'
  const companyPhone = import.meta.env.VITE_COMPANY_PHONE || '+49 123 456789'
  const companyEmail = import.meta.env.VITE_COMPANY_EMAIL || 'info@devops-tracker.com'
  const ceoName = import.meta.env.VITE_CEO_NAME || 'Max Mustermann'
  const registerCourt = import.meta.env.VITE_REGISTER_COURT || 'Amtsgericht Musterstadt'
  const registerNumber = import.meta.env.VITE_REGISTER_NUMBER || 'HRB 12345'
  const vatId = import.meta.env.VITE_VAT_ID || 'DE123456789'
  const foundingYear = import.meta.env.VITE_FOUNDING_YEAR || '2024'
  const professionalTitle = import.meta.env.VITE_PROFESSIONAL_TITLE || ''
  const professionalChamber = import.meta.env.VITE_PROFESSIONAL_CHAMBER || ''
  const supervisoryAuthority = import.meta.env.VITE_SUPERVISORY_AUTHORITY || ''

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Breadcrumbs 
        items={[
          { label: t('impressum'), current: true }
        ]} 
        className="mb-6"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center mb-6">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('impressum')}
          </h1>
        </div>

        <div className="space-y-8">
          {/* Unternehmensinformationen */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              {t('company_information')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Building className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{companyName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('legal_entity')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('address')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{companyAddress}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('phone')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{companyPhone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('email')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{companyEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Geschäftsführung */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              {t('management')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100">
                <span className="font-medium">{t('ceo')}:</span> {ceoName}
              </p>
            </div>
          </section>

          {/* Handelsregister */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('commercial_register')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <p className="text-gray-900 dark:text-gray-100">
                <span className="font-medium">{t('register_court')}:</span> {registerCourt}
              </p>
              <p className="text-gray-900 dark:text-gray-100">
                <span className="font-medium">{t('register_number')}:</span> {registerNumber}
              </p>
            </div>
          </section>

          {/* Steuernummern */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('tax_information')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100">
                <span className="font-medium">{t('vat_id')}:</span> {vatId}
              </p>
            </div>
          </section>

          {/* Berufsaufsicht (falls relevant) */}
          {supervisoryAuthority && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('supervisory_authority')}
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{t('authority')}:</span> {supervisoryAuthority}
                </p>
              </div>
            </section>
          )}

          {/* Berufsbezeichnung (falls relevant) */}
          {professionalTitle && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('professional_information')}
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{t('professional_title')}:</span> {professionalTitle}
                </p>
                {professionalChamber && (
                  <p className="text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{t('professional_chamber')}:</span> {professionalChamber}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Gründung */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              {t('founding')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100">
                <span className="font-medium">{t('founded_in')}:</span> {foundingYear}
              </p>
            </div>
          </section>

          {/* Haftungsausschluss */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('disclaimer')}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                {t('impressum_disclaimer_text')}
              </p>
            </div>
          </section>

          {/* Urheberrecht */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('copyright')}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                {t('copyright_text', { year: new Date().getFullYear(), company: companyName })}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ImpressumPage 
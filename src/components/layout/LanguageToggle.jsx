import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es'

  const toggle = () => {
    const next = currentLang === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-sm font-medium text-gray-700 transition-colors"
      title="Toggle language"
    >
      {currentLang === 'es' ? '🇨🇴 ES' : '🇨🇦 EN'}
    </button>
  )
}

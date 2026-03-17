import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LanguageToggle } from './LanguageToggle'

export function TopBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { lockAll } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleLockAll = () => {
    lockAll()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">💚 {t('app_title')}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="px-2 py-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
          aria-label="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <LanguageToggle />

        <button
          onClick={handleLockAll}
          title={t('pin.lock_all')}
          className="px-2 py-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-500 transition-colors text-lg"
          aria-label={t('pin.lock_all')}
        >
          🔒
        </button>
      </div>
    </header>
  )
}

import { useTranslation } from 'react-i18next'
import nexvidaLogo from '../../assets/favicon.svg'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LanguageToggle } from './LanguageToggle'
import { Sun, Moon, Lock } from 'lucide-react'

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
    <header className="sticky top-0 z-30 glass-nav border-b border-black/8 dark:border-white/8 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src={nexvidaLogo} width="26" height="26" alt="Nexvida logo" className="rounded-lg" />
        <span className="text-[17px] font-bold tracking-tight bg-gradient-to-r from-brand-400 to-blue-400 bg-clip-text text-transparent">
          {t('app_title')}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full text-ios-gray hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
        </button>

        <LanguageToggle />

        <button
          onClick={handleLockAll}
          title={t('pin.lock_all')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-ios-gray hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label={t('pin.lock_all')}
        >
          <Lock size={17} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}

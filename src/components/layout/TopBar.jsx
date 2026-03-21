import { useTranslation } from 'react-i18next'
import nexvidaLogo from '../../assets/favicon.svg'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProfileContext } from '../../context/ProfileContext'
import { useTheme } from '../../context/ThemeContext'
import { LanguageToggle } from './LanguageToggle'
import { Sun, Moon, LogOut } from 'lucide-react'

export function TopBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { lockAll } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { setActiveProfileId } = useProfileContext()

  const handleLockAll = () => {
    lockAll()
    setActiveProfileId(null)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 glass-nav border-b border-[var(--border)] px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src={nexvidaLogo} width="26" height="26" alt="Nexvida logo" className="rounded-lg" />
        <span className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('app_title')}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
        </button>

        <LanguageToggle />

        <button
          onClick={handleLockAll}
          title={t('pin.lock_all')}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={t('pin.lock_all')}
        >
          <LogOut size={17} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}

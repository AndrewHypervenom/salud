import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useTheme } from '../../context/ThemeContext'
import { LanguageToggle } from './LanguageToggle'
import { ProfileSelector } from '../shared/ProfileSelector'

export function TopBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeProfileId } = useProfileContext()
  const { isUnlocked, lockAll } = useAuth()
  const { profiles } = useProfiles()
  const [showSheet, setShowSheet] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const activeProfile = profiles.find(p => p.id === activeProfileId)
  const profileLocked = activeProfile?.access_code && !isUnlocked(activeProfileId)

  const handleLockAll = () => {
    lockAll()
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">💚 {t('app_title')}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="px-2 py-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
            aria-label="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <LanguageToggle />

          {/* Lock all button */}
          <button
            onClick={handleLockAll}
            title={t('pin.lock_all')}
            className="px-2 py-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-500 transition-colors text-lg"
            aria-label={t('pin.lock_all')}
          >
            🔒
          </button>

          {/* Profile switcher */}
          <button
            onClick={() => setShowSheet(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
              {activeProfile ? activeProfile.name[0].toUpperCase() : '?'}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
              {activeProfile ? activeProfile.name : t('profile.no_profile')}
            </span>
            {profileLocked && <span className="text-xs">🔒</span>}
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Bottom sheet modal */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center" onClick={() => setShowSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl w-full md:max-w-sm p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{t('profile.select')}</h2>
              <button onClick={() => setShowSheet(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <ProfileSelector onClose={() => setShowSheet(false)} />
          </div>
        </div>
      )}
    </>
  )
}

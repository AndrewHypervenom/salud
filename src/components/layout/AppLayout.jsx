import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { BadgeCelebration, useBadgeCelebration } from '../shared/BadgeCelebration'
import { useProfileContext } from '../../context/ProfileContext'
import { usePageTracking } from '../../hooks/usePageTracking'

export default function AppLayout() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { celebrationBadge, dismiss } = useBadgeCelebration()
  const { activeProfileId } = useProfileContext()
  usePageTracking(activeProfileId)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-24 md:pb-8 overflow-x-hidden">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />

      {celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          lang={lang}
          onDismiss={dismiss}
        />
      )}
    </div>
  )
}

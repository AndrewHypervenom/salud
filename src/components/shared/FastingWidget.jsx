import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import { Card } from '../ui/Card'
import { ProgressRing } from '../ui/ProgressRing'
import { ElapsedTimer } from '../ui/CountdownTimer'
import { useFasting } from '../../hooks/useFasting'

export function FastingWidget({ profileId }) {
  const { t } = useTranslation()
  const { activeSession, startFast } = useFasting(profileId)

  const handleStart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try { await startFast(16) } catch (err) { console.error(err) }
  }

  if (!activeSession) {
    return (
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-violet-500">
            <Zap size={28} strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-0.5">{t('fasting.title')}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('fasting.no_active')}</p>
          </div>
          <button
            onClick={handleStart}
            className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors flex-shrink-0"
          >
            {t('fasting.start')}
          </button>
        </div>
      </Card>
    )
  }

  const startMs = new Date(activeSession.start_time).getTime()
  const targetMs = startMs + activeSession.target_hours * 60 * 60 * 1000
  const elapsed = Date.now() - startMs
  const elapsedHours = elapsed / (1000 * 60 * 60)
  const percent = Math.min((elapsedHours / activeSession.target_hours) * 100, 100)

  return (
    <Link to="/fasting">
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <ProgressRing percent={percent} size={64} strokeWidth={7} color="#7c3aed">
            <Zap size={18} strokeWidth={1.75} className="text-violet-500" />
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-0.5">{t('fasting.active')}</p>
            <p className="text-xl font-bold text-violet-600">
              <ElapsedTimer startTime={activeSession.start_time} />
            </p>
            <p className="text-xs text-gray-400">{t('fasting.meta_short', { h: activeSession.target_hours, pct: Math.round(percent) })}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

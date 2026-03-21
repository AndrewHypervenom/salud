import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, AlertTriangle, Dumbbell } from 'lucide-react'
import { useHealthCoach } from '../../hooks/useHealthCoach'
import { useBadges } from '../../hooks/useBadges'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

export function HealthCoach({ profileId, profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP }) {
  const { t } = useTranslation()
  const { todayAnalysis, loading, initialLoading, error, analyze } = useHealthCoach(profileId)
  const { checkAndUnlock } = useBadges(profileId)
  const autoTriggered = useRef(false)

  const hasDinner = foodLogs.some(l => l.meal_type === 'dinner')

  // Detect if food was logged AFTER the last analysis
  const lastLogTime = foodLogs.length > 0
    ? Math.max(...foodLogs.map(l => new Date(l.logged_at).getTime()))
    : 0
  const isStale = todayAnalysis && lastLogTime > new Date(todayAnalysis.updated_at).getTime()

  // Auto-trigger once when dinner is logged and no analysis exists
  useEffect(() => {
    if (initialLoading) return
    if (autoTriggered.current) return
    if (!hasDinner) return
    if (todayAnalysis) return
    if (loading) return

    autoTriggered.current = true
    analyze({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP })
      .then(() => checkAndUnlock('first_coach', true))
  }, [initialLoading, hasDinner, todayAnalysis, loading])

  const handleAnalyze = async () => {
    await analyze({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP })
    await checkAndUnlock('first_coach', true)
  }

  // Loading initial check from DB
  if (initialLoading) return null

  // Generating
  if (loading) {
    return (
      <Card className="border border-primary-200 bg-primary-50/50 dark:bg-primary-900/10">
        <div className="flex items-center gap-3 py-2">
          <Spinner />
          <p className="text-sm text-gray-500">{t('coach.generating')}</p>
        </div>
      </Card>
    )
  }

  // No analysis yet + no dinner logged
  if (!todayAnalysis && !hasDinner) {
    return (
      <Card className="border border-dashed border-primary-300 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-700">
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <Bot size={36} strokeWidth={1.5} className="text-primary-500" />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{t('coach.title')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('coach.auto_hint')}
            </p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button onClick={handleAnalyze} className="w-full" disabled={foodLogs.length === 0}>
            {t('coach.analyze_now')}
          </Button>
        </div>
      </Card>
    )
  }

  // No analysis yet but dinner is logged (auto-trigger in progress or failed)
  if (!todayAnalysis) {
    return (
      <Card className="border border-dashed border-primary-300 bg-primary-50/50 dark:bg-primary-900/10">
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <Bot size={36} strokeWidth={1.5} className="text-primary-500" />
          {error && (
            <>
              <p className="text-xs text-red-500">{error}</p>
              <Button onClick={handleAnalyze} className="w-full">{t('coach.retry')}</Button>
            </>
          )}
        </div>
      </Card>
    )
  }

  // Analysis exists — show results
  return (
    <div className="flex flex-col gap-3">
      {/* Stale warning */}
      {isStale && (
        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-xl px-4 py-2 text-sm text-amber-700 dark:text-amber-300 w-full text-left"
        >
          <AlertTriangle size={16} strokeWidth={1.75} className="flex-shrink-0" />
          <span className="flex-1">{t('coach.stale_warning')}</span>
          <span className="font-semibold underline">{t('coach.regenerate')}</span>
        </button>
      )}

      {/* Análisis del día */}
      <Card className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20">
        <div className="flex items-start gap-2">
          <Bot size={22} strokeWidth={1.5} className="flex-shrink-0 text-primary-500 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide mb-1">
              {t('coach.analysis_today')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              {todayAnalysis.analysis_text}
            </p>
          </div>
        </div>
      </Card>

      {/* Recomendaciones */}
      {todayAnalysis.recommendations?.map((rec, i) => (
        <Card key={i} className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">{rec.icon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{rec.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">{rec.text}</p>
          </div>
        </Card>
      ))}

      {/* Plan de mañana */}
      {todayAnalysis.tomorrow_plan && (
        <Card className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
            {t('coach.tomorrow_plan')}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {todayAnalysis.tomorrow_plan}
          </p>
        </Card>
      )}

      {/* Motivación */}
      {todayAnalysis.motivation && (
        <p className="text-center text-sm font-medium text-primary-600 dark:text-primary-400 px-4">
          <Dumbbell size={15} strokeWidth={1.75} className="inline mr-1.5" />{todayAnalysis.motivation}
        </p>
      )}

      {/* Regenerar manual */}
      <button
        onClick={handleAnalyze}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-center underline"
      >
        {t('coach.regenerate_analysis')}
      </button>
    </div>
  )
}

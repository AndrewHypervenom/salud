import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Dumbbell, Sparkles } from 'lucide-react'
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
  const reanalyzing = useRef(false)
  const [showToast, setShowToast] = useState(false)
  const toastTimer = useRef(null)

  const showUpdatedToast = () => {
    clearTimeout(toastTimer.current)
    setShowToast(true)
    toastTimer.current = setTimeout(() => setShowToast(false), 3500)
  }

  const hasEnoughFood = foodLogs.length >= 3

  // Detect if food was logged AFTER the last analysis
  const lastLogTime = foodLogs.length > 0
    ? Math.max(...foodLogs.map(l => new Date(l.logged_at).getTime()))
    : 0
  const isStale = todayAnalysis && lastLogTime > new Date(todayAnalysis.updated_at).getTime()

  // Auto-trigger initial analysis when 3+ foods are logged
  useEffect(() => {
    if (initialLoading) return
    if (loading) return
    if (!hasEnoughFood) return
    if (todayAnalysis) return
    if (autoTriggered.current) return

    autoTriggered.current = true
    analyze({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP })
      .then(() => { checkAndUnlock('first_coach', true); showUpdatedToast() })
  }, [initialLoading, loading, hasEnoughFood, todayAnalysis])

  // Auto-re-analyze whenever food is added after last analysis
  useEffect(() => {
    if (initialLoading) return
    if (loading) return
    if (!isStale) return
    if (reanalyzing.current) return

    reanalyzing.current = true
    analyze({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP })
      .then(() => showUpdatedToast())
      .finally(() => { reanalyzing.current = false })
  }, [initialLoading, loading, isStale])

  const handleAnalyze = async () => {
    await analyze({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP })
    await checkAndUnlock('first_coach', true)
  }

  const toast = showToast && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-5 py-3 animate-slide-down border border-primary-200 dark:border-primary-700">
      <Sparkles size={20} className="text-primary-500 flex-shrink-0" />
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('coach.updated_toast')}</p>
      <button onClick={() => setShowToast(false)} className="ml-2 text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
    </div>
  )

  // Loading initial check from DB
  if (initialLoading) return toast ?? null

  // Generating
  if (loading) {
    return (
      <>
        {toast}
        <Card className="border border-primary-200 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-center gap-3 py-2">
            <Spinner />
            <p className="text-sm text-gray-500">{t('coach.generating')}</p>
          </div>
        </Card>
      </>
    )
  }

  // No analysis yet + less than 3 foods logged
  if (!todayAnalysis && !hasEnoughFood) {
    return (
      <>
        {toast}
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
      </>
    )
  }

  // No analysis yet but 3+ foods logged (auto-trigger in progress or failed)
  if (!todayAnalysis) {
    return (
      <>
        {toast}
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
      </>
    )
  }

  // Analysis exists — show results
  return (
    <div className="flex flex-col gap-3">
      {toast}

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

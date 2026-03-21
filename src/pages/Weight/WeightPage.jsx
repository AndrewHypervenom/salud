import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Scale, TrendingDown, TrendingUp, Loader2, X, Sparkles, Brain } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useWeightLogs } from '../../hooks/useWeightLogs'
import { useBadges } from '../../hooks/useBadges'
import { useFoodLogsByDay } from '../../hooks/useFoodLogs'
import { useExerciseLogsByDay } from '../../hooks/useExerciseLogs'
import { WeightChart } from '../../components/ui/WeightChart'
import { Spinner } from '../../components/ui/Spinner'
import { BadgeNotification } from '../../components/shared/BadgeNotification'
import { calcBMR, calcTDEE } from '../../lib/formulas'
import {
  calcEstimatedWeightSeries,
  calcTodayEstimatedWeight,
  calcWeeklyStats,
  getTopFoods,
  calcWeightRecommendation,
  getMotivationalPhrase,
} from '../../lib/weightEstimation'

export default function WeightPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const profile = profiles.find(p => p.id === activeProfileId)
  const { logs, loading, latestWeight, addWeight, deleteWeight } = useWeightLogs(activeProfileId)
  const { newBadge, checkAndUnlock, clearNewBadge } = useBadges(activeProfileId)
  const { foodLogsByDay, rawLogs } = useFoodLogsByDay(activeProfileId, 60)
  const { exerciseLogsByDay } = useExerciseLogsByDay(activeProfileId, 60)

  const [showForm, setShowForm] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const targetWeight = profile?.target_weight_kg || null
  const recentLogs = showAll ? logs : logs.slice(0, 10)

  const handleSave = async () => {
    const kg = parseFloat(newWeight)
    if (!kg || kg < 20) return
    setSaving(true)
    try {
      await addWeight(kg, newDate)
      if (targetWeight && Math.abs(kg - targetWeight) <= 0.5) {
        await checkAndUnlock('goal_reached', true)
      }
      setShowForm(false)
      setNewWeight('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try { await deleteWeight(id) } catch (e) { console.error(e) }
    setDeleting(null)
  }

  // Estadísticas básicas
  const diff = (latestWeight && targetWeight) ? Math.round((latestWeight - targetWeight) * 10) / 10 : null
  const last7 = logs.slice(0, 7)
  const weeklyChange = last7.length >= 2
    ? Math.round((last7[0].weight_kg - last7[last7.length - 1].weight_kg) * 100) / 100
    : null

  const projectionWeeks = (diff !== null && weeklyChange && weeklyChange !== 0)
    ? Math.ceil(Math.abs(diff) / Math.abs(weeklyChange))
    : null

  // Progreso hacia la meta (0–100%)
  const progressPct = useMemo(() => {
    if (!latestWeight || !targetWeight || !profile?.weight_kg) return null
    const startW = profile.weight_kg
    const total = Math.abs(targetWeight - startW)
    if (total === 0) return 100
    const done = Math.abs(latestWeight - startW)
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)))
  }, [latestWeight, targetWeight, profile?.weight_kg])

  // TDEE puro para estimación
  const tdee = profile ? calcTDEE(calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex), profile.activity) : 0

  // Peso estimado por IA
  const estimatedSeries = useMemo(() => {
    if (!tdee || !foodLogsByDay || Object.keys(foodLogsByDay).length === 0) return []
    return calcEstimatedWeightSeries(logs, foodLogsByDay, exerciseLogsByDay, tdee, profile?.weight_kg)
  }, [logs, foodLogsByDay, exerciseLogsByDay, tdee, profile?.weight_kg])

  const todayEstimatedWeight = useMemo(() => calcTodayEstimatedWeight(estimatedSeries), [estimatedSeries])

  const weeklyStats = useMemo(() =>
    calcWeeklyStats(foodLogsByDay, exerciseLogsByDay, tdee, 7),
    [foodLogsByDay, exerciseLogsByDay, tdee]
  )

  const topFoods = useMemo(() => getTopFoods(rawLogs), [rawLogs])

  const hasRecentFoodLogs = useMemo(() => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toLocaleDateString('en-CA')
    return Object.keys(foodLogsByDay).some(d => d >= threeDaysAgo)
  }, [foodLogsByDay])

  const recommendation = useMemo(() =>
    calcWeightRecommendation(weeklyChange, weeklyStats.avgNetBalance, weeklyStats.daysOverTarget, topFoods, profile?.health_goal, hasRecentFoodLogs),
    [weeklyChange, weeklyStats, topFoods, profile?.health_goal, hasRecentFoodLogs]
  )

  // Trend con 5 estados claros
  const trend = useMemo(() => {
    if (!hasRecentFoodLogs) return 'no_food'
    if (weeklyChange === null) return 'no_weight'
    if (weeklyChange < -0.1) return 'losing'
    if (weeklyChange > 0.1) return 'gaining'
    return 'stable'
  }, [hasRecentFoodLogs, weeklyChange])

  const motivationalPhrase = useMemo(() =>
    getMotivationalPhrase(profile?.health_goal, trend, lang),
    [profile?.health_goal, trend, lang]
  )

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Scale size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  const estimatedDelta = (todayEstimatedWeight !== null && latestWeight !== null)
    ? Math.round((todayEstimatedWeight - latestWeight) * 10) / 10
    : null

  const diffColor = diff === null ? 'text-gray-400'
    : diff === 0 ? 'text-green-500'
    : (profile?.health_goal === 'gain_muscle' ? diff > 0 : diff < 0) ? 'text-green-500'
    : 'text-amber-500'

  return (
    <div className="flex flex-col gap-4 pb-6">
      <BadgeNotification badge={newBadge} onDismiss={clearNewBadge} lang={lang} />

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('weight.title')}
        </h1>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-semibold hover:bg-primary-700 active:scale-95 transition-all"
        >
          <span className="text-base leading-none">+</span>
          {t('weight.log_weight')}
        </button>
      </div>

      {/* Formulario inline — sheet style */}
      {showForm && (
        <div className="card rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{t('weight.log_weight')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium px-1">{lang === 'es' ? 'Peso (kg)' : 'Weight (kg)'}</label>
              <input
                type="number"
                step="0.1" min="20" max="300"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="70.5"
                className="px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium px-1">{lang === 'es' ? 'Fecha' : 'Date'}</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!newWeight || saving}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700 active:scale-95 transition-all"
            >
              {saving ? <Spinner size="sm" /> : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Hero card */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-700 dark:to-primary-900 text-white p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-primary-100 text-xs font-medium uppercase tracking-widest mb-1">{t('weight.kg_registered')}</p>
            <div className="flex items-end gap-2">
              <p className="text-5xl font-bold tracking-tight leading-none">
                {latestWeight ?? '—'}
              </p>
              <p className="text-primary-200 text-lg mb-1">kg</p>
            </div>
            {logs[0] && (
              <p className="text-primary-200 text-xs mt-1.5">{logs[0].logged_date}</p>
            )}
          </div>
          {targetWeight && (
            <div className="text-right">
              <p className="text-primary-200 text-xs">{t('weight.kg_goal')}</p>
              <p className="text-2xl font-bold">{targetWeight} <span className="text-lg font-normal">kg</span></p>
              {diff !== null && (
                <p className={`text-xs mt-0.5 font-semibold ${diff === 0 ? 'text-green-300' : 'text-primary-100'}`}>
                  {diff > 0 ? `+${diff}` : diff} kg
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progressPct !== null && (
          <div>
            <div className="flex justify-between text-xs text-primary-200 mb-1.5">
              <span>{lang === 'es' ? 'Progreso hacia tu meta' : 'Progress toward goal'}</span>
              <span className="font-semibold">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-primary-400/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fila de métricas secundarias */}
      <div className="grid grid-cols-2 gap-3">
        {/* Estimado IA */}
        <div className="card rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain size={13} className="text-blue-400" />
            <p className="text-xs text-gray-400 font-medium">{t('weight.kg_estimated')}</p>
          </div>
          <p className="text-2xl font-bold text-blue-500 dark:text-blue-400 leading-none">
            {todayEstimatedWeight !== null ? todayEstimatedWeight : '—'}
            {todayEstimatedWeight !== null && <span className="text-sm font-normal text-gray-400 ml-1">kg</span>}
          </p>
          {estimatedDelta !== null && (
            <p className={`text-xs mt-1 font-medium ${estimatedDelta > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {estimatedDelta > 0 ? `+${estimatedDelta}` : estimatedDelta} kg vs registrado
            </p>
          )}
          {todayEstimatedWeight === null && (
            <p className="text-xs text-gray-400 mt-1 leading-snug">{lang === 'es' ? 'Registra comidas para activar' : 'Log meals to activate'}</p>
          )}
        </div>

        {/* Tendencia */}
        <div className="card rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {weeklyChange !== null && weeklyChange < 0
              ? <TrendingDown size={13} className="text-green-500" />
              : <TrendingUp size={13} className="text-amber-500" />
            }
            <p className="text-xs text-gray-400 font-medium">{lang === 'es' ? 'Tendencia' : 'Trend'}</p>
          </div>
          {weeklyChange !== null ? (
            <>
              <p className={`text-2xl font-bold leading-none ${weeklyChange < 0 ? 'text-green-500' : 'text-amber-500'}`}>
                {weeklyChange > 0 ? '+' : ''}{weeklyChange}
                <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{t('weight.per_week')}</p>
              {projectionWeeks && diff !== null && Math.abs(diff) > 0.5 && (
                <p className="text-xs text-primary-500 mt-1 font-medium">~{projectionWeeks} {lang === 'es' ? 'sem.' : 'wks'}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-300 leading-none">—</p>
              <p className="text-xs text-gray-400 mt-1 leading-snug">{lang === 'es' ? 'Pésate 2+ veces para ver' : 'Weigh in 2+ times to see'}</p>
            </>
          )}
        </div>
      </div>

      {/* Gráfico */}
      {(logs.length > 0 || estimatedSeries.length > 0) && (
        <div className="card rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{t('weight.history')}</p>
          <WeightChart
            logs={logs.slice(0, 30)}
            estimatedLogs={estimatedSeries}
            targetWeight={targetWeight}
            height={160}
          />
        </div>
      )}

      {/* Recomendación personalizada */}
      {recommendation && (
        <div className="card rounded-2xl p-4">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-base">
                {recommendation.type === 'losing_good' || recommendation.type === 'gaining_good' || recommendation.type === 'maintaining_good'
                  ? '✅' : recommendation.type === 'no_data' ? '📊' : '💡'}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5 uppercase tracking-wide">{lang === 'es' ? 'Tu análisis' : 'Your analysis'}</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                {t(`weight.rec_${recommendation.type}`, { food: recommendation.topFood || '' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Frase motivadora */}
      {motivationalPhrase && (
        <div className="card rounded-2xl px-4 py-3.5 border-l-4 border-l-primary-500">
          <div className="flex gap-2.5 items-start">
            <Sparkles size={15} className="text-primary-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
              {motivationalPhrase}
            </p>
          </div>
        </div>
      )}

      {/* Lista de registros */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <Scale size={28} strokeWidth={1.5} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">{t('weight.no_logs')}</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary-600 font-medium"
          >
            + {t('weight.log_weight')}
          </button>
        </div>
      ) : (
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t('weight.history')}</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentLogs.map((log, idx) => {
              const logDiff = targetWeight ? Math.round((log.weight_kg - targetWeight) * 10) / 10 : null
              const isGoal = logDiff !== null && Math.abs(logDiff) <= 0.5
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isGoal ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <Scale size={15} strokeWidth={1.75} className={isGoal ? 'text-green-500' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{log.weight_kg} kg</p>
                    <p className="text-xs text-gray-400">{log.logged_date}</p>
                  </div>
                  {logDiff !== null && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isGoal
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : logDiff > 0
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {logDiff > 0 ? `+${logDiff}` : logDiff} kg
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deleting === log.id}
                    className="text-gray-200 dark:text-gray-700 hover:text-red-400 transition-colors p-1 ml-1"
                  >
                    {deleting === log.id ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                  </button>
                </div>
              )
            })}
          </div>
          {logs.length > 10 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="w-full text-sm text-primary-600 font-medium py-3 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {showAll ? t('weight.show_less') : t('weight.show_all', { n: logs.length })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

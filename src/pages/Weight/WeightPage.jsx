import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Scale, TrendingDown, TrendingUp, Loader2, X } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useWeightLogs } from '../../hooks/useWeightLogs'
import { useBadges } from '../../hooks/useBadges'
import { useFoodLogsByDay } from '../../hooks/useFoodLogs'
import { useExerciseLogsByDay } from '../../hooks/useExerciseLogs'
import { WeightChart } from '../../components/ui/WeightChart'
import { Card } from '../../components/ui/Card'
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
  const recentLogs = showAll ? logs : logs.slice(0, 14)

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

  // TDEE para estimación (sin ajuste por objetivo — usar mantenimiento puro)
  const tdee = profile ? calcTDEE(calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex), profile.activity) : 0

  // Peso estimado por IA
  const estimatedSeries = useMemo(() => {
    if (!tdee || !foodLogsByDay || Object.keys(foodLogsByDay).length === 0) return []
    return calcEstimatedWeightSeries(logs, foodLogsByDay, exerciseLogsByDay, tdee, profile?.weight_kg)
  }, [logs, foodLogsByDay, exerciseLogsByDay, tdee, profile?.weight_kg])

  const todayEstimatedWeight = useMemo(() => calcTodayEstimatedWeight(estimatedSeries), [estimatedSeries])

  // Stats semanales y recomendaciones
  const weeklyStats = useMemo(() =>
    calcWeeklyStats(foodLogsByDay, exerciseLogsByDay, tdee, 7),
    [foodLogsByDay, exerciseLogsByDay, tdee]
  )

  const topFoods = useMemo(() => getTopFoods(rawLogs), [rawLogs])

  const hasRecentLogs = useMemo(() => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toLocaleDateString('en-CA')
    return Object.keys(foodLogsByDay).some(d => d >= threeDaysAgo)
  }, [foodLogsByDay])

  const recommendation = useMemo(() =>
    calcWeightRecommendation(weeklyChange, weeklyStats.avgNetBalance, weeklyStats.daysOverTarget, topFoods, profile?.health_goal, hasRecentLogs),
    [weeklyChange, weeklyStats, topFoods, profile?.health_goal, hasRecentLogs]
  )

  const motivationalPhrase = useMemo(() => {
    const trend = weeklyChange === null ? 'no_data' : weeklyChange < -0.1 ? 'losing' : weeklyChange > 0.1 ? 'gaining' : 'stable'
    return getMotivationalPhrase(profile?.health_goal, trend, hasRecentLogs, lang)
  }, [weeklyChange, profile?.health_goal, hasRecentLogs, lang])

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Scale size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  const recIcon = recommendation
    ? (recommendation.type === 'losing_good' || recommendation.type === 'gaining_good' || recommendation.type === 'maintaining_good'
        ? '✅'
        : recommendation.type === 'no_data'
        ? '📝'
        : '💡')
    : null

  const estimatedDelta = (todayEstimatedWeight !== null && latestWeight !== null)
    ? Math.round((todayEstimatedWeight - latestWeight) * 10) / 10
    : null

  return (
    <div className="flex flex-col gap-4">
      <BadgeNotification badge={newBadge} onDismiss={clearNewBadge} lang={lang} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Scale size={26} strokeWidth={1.75} className="text-primary-500" />
          {t('weight.title')}
        </h1>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          + {t('weight.log_weight')}
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('weight.log_weight')}</p>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="70.5"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
            />
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!newWeight || saving}
              className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700 transition-colors"
            >
              {saving ? <Spinner size="sm" /> : t('common.save')}
            </button>
          </div>
        </Card>
      )}

      {/* Stats — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="text-center py-3">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {latestWeight ?? '—'}
          </p>
          <p className="text-xs text-gray-400 leading-tight">{t('weight.kg_registered')}</p>
          {logs[0] && (
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{logs[0].logged_date}</p>
          )}
        </Card>
        <Card className="text-center py-3">
          <p className="text-xl font-bold text-orange-500">
            {todayEstimatedWeight !== null ? todayEstimatedWeight : '—'}
          </p>
          <p className="text-xs text-gray-400 leading-tight">{t('weight.kg_estimated')}</p>
          {estimatedDelta !== null && (
            <p className={`text-xs mt-0.5 font-medium ${estimatedDelta > 0 ? 'text-amber-500' : 'text-green-500'}`}>
              {estimatedDelta > 0 ? `+${estimatedDelta}` : estimatedDelta} kg
            </p>
          )}
        </Card>
        <Card className="text-center py-3">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {targetWeight ?? '—'}
          </p>
          <p className="text-xs text-gray-400 leading-tight">{t('weight.kg_goal')}</p>
        </Card>
        <Card className="text-center py-3">
          <p className={`text-xl font-bold ${diff === null ? 'text-gray-400' : diff > 0 ? 'text-amber-500' : diff < 0 ? 'text-red-500' : 'text-green-600'}`}>
            {diff !== null ? (diff > 0 ? `+${diff}` : diff) : '—'}
          </p>
          <p className="text-xs text-gray-400 leading-tight">{t('weight.kg_diff')}</p>
        </Card>
      </div>

      {weeklyChange !== null && (
        <Card className="flex items-center gap-3 py-3">
          {weeklyChange < 0
            ? <TrendingDown size={24} strokeWidth={1.75} className="text-green-500 flex-shrink-0" />
            : <TrendingUp size={24} strokeWidth={1.75} className="text-amber-500 flex-shrink-0" />
          }
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {weeklyChange < 0 ? t('weight.trending_down') : t('weight.trending_up')} {Math.abs(weeklyChange)} {t('weight.per_week')}
            </p>
            {projectionWeeks && diff !== null && Math.abs(diff) > 0.5 && (
              <p className="text-xs text-gray-400">
                {t('weight.projection', { weeks: projectionWeeks })}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Gráfico con ambas líneas */}
      {(logs.length > 0 || estimatedSeries.length > 0) && (
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('weight.history')}</p>
          <WeightChart
            logs={logs.slice(0, 30)}
            estimatedLogs={estimatedSeries}
            targetWeight={targetWeight}
            height={160}
          />
        </Card>
      )}

      {/* Recomendación personalizada */}
      {recommendation && (
        <Card className="flex gap-3 items-start py-3">
          <span className="text-xl flex-shrink-0 mt-0.5">{recIcon}</span>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {t(`weight.rec_${recommendation.type}`, { food: recommendation.topFood || '' })}
          </p>
        </Card>
      )}

      {/* Frase motivadora */}
      {motivationalPhrase && (
        <Card className="py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
          <p className="text-sm text-primary-700 dark:text-primary-300 text-center italic">
            "{motivationalPhrase}"
          </p>
        </Card>
      )}

      {/* Lista de registros */}
      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center gap-3">
          <Scale size={48} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-gray-400 text-sm">{t('weight.no_logs')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recentLogs.map(log => (
            <Card key={log.id} className="flex items-center gap-3 py-2.5">
              <Scale size={20} strokeWidth={1.75} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{log.weight_kg} kg</p>
                <p className="text-xs text-gray-400">{log.logged_date}</p>
              </div>
              {targetWeight && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  Math.abs(log.weight_kg - targetWeight) <= 0.5
                    ? 'bg-green-100 text-green-700'
                    : log.weight_kg > targetWeight
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {log.weight_kg > targetWeight ? `+${Math.round((log.weight_kg - targetWeight) * 10) / 10}` : Math.round((log.weight_kg - targetWeight) * 10) / 10} kg
                </span>
              )}
              <button
                onClick={() => handleDelete(log.id)}
                disabled={deleting === log.id}
                className="text-gray-300 hover:text-red-400 transition-colors p-1"
              >
                {deleting === log.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              </button>
            </Card>
          ))}
          {logs.length > 14 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-sm text-primary-600 text-center py-2"
            >
              {showAll ? t('weight.show_less') : t('weight.show_all', { n: logs.length })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

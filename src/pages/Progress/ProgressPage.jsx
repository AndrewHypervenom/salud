import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TrendingUp, BarChart3, Scale, Bot, Dumbbell, ChevronUp, ChevronDown, Flame, Zap } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { useWeightLogs } from '../../hooks/useWeightLogs'
import { useFoodLogs, useFoodLogsByDay } from '../../hooks/useFoodLogs'
import { useExerciseLogs } from '../../hooks/useExerciseLogs'
import { calcBMR, calcTDEE, calcCalorieTargetFromProfile, calcExerciseEatBack } from '../../lib/formulas'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { WeightChart } from '../../components/ui/WeightChart'

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dateStr, lang) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDate()
  const month = lang === 'es' ? MONTH_NAMES_ES[d.getMonth()] : MONTH_NAMES_EN[d.getMonth()]
  return `${day} ${month}`
}

function formatWeekRange(monday, lang) {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const m = lang === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN
  return `${monday.getDate()} ${m[monday.getMonth()]} – ${sunday.getDate()} ${m[sunday.getMonth()]}`
}

function CaloriePct({ calories, target }) {
  const pct = target > 0 ? Math.min((calories / target) * 100, 120) : 0
  const color = pct > 100 ? 'bg-red-400' : pct >= 80 ? 'bg-amber-400' : 'bg-primary-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
        {calories} / {target}
      </span>
    </div>
  )
}

function DayCard({ a, lang, t }) {
  const [open, setOpen] = useState(false)
  const pct = a.cal_target > 0 ? (a.total_calories / a.cal_target) * 100 : 0
  const statusColor = pct > 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-500' : 'text-primary-600'
  const statusDot = pct > 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-green-500'

  return (
    <div
      className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${statusDot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(a.analysis_date, lang)}</p>
          <CaloriePct calories={a.total_calories} target={a.cal_target} />
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${statusColor}`}>
          {Math.round(pct)}%
        </span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
          {a.analysis_text && (
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <Bot size={13} strokeWidth={1.75} className="inline mr-1 text-primary-500" />{a.analysis_text}
            </p>
          )}
          {a.tomorrow_plan && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-0.5">{t('progress.tomorrow_plan_label')}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{a.tomorrow_plan}</p>
            </div>
          )}
          {a.motivation && (
            <p className="text-xs text-primary-600 dark:text-primary-400 italic flex items-center gap-1">
              <Dumbbell size={12} strokeWidth={2} />{a.motivation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProgressPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const { analyses, loading, weeks, months } = useAnalysisHistory(activeProfileId)
  const { logs: weightLogs, loading: weightLoading, latestWeight } = useWeightLogs(activeProfileId)
  const { todayCalories } = useFoodLogs(activeProfileId)
  const { todayCaloriesBurned } = useExerciseLogs(activeProfileId)
  const { foodLogsByDay } = useFoodLogsByDay(activeProfileId)
  const [tab, setTab] = useState('analysis') // 'analysis' | 'weight'
  const [view, setView] = useState('weeks') // 'weeks' | 'months' | 'all'

  const profile = profiles.find(p => p.id === activeProfileId)

  // Cálculos de objetivo en tiempo real (con ejercicio del día)
  const todayDateStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
  const bmr = profile ? calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex) : 0
  const tdee = profile ? calcTDEE(bmr, profile.activity) : 0
  const baseCalTarget = calcCalorieTargetFromProfile(profile, tdee)
  const { extraCals: exerciseExtraCals = 0 } = calcExerciseEatBack(
    todayCaloriesBurned ?? 0,
    profile?.health_goal ?? 'improve_health',
  )
  const adjustedCalTarget = baseCalTarget + exerciseExtraCals

  // Para el día actual, sustituye datos del snapshot con valores en vivo.
  // Para días pasados, corrige total_calories con los food_logs reales (el snapshot puede estar desactualizado).
  const liveEntry = (a) => {
    if (a.analysis_date === todayDateStr) {
      return { ...a, total_calories: todayCalories, cal_target: adjustedCalTarget }
    }
    const dayData = foodLogsByDay[a.analysis_date]
    if (dayData) {
      return { ...a, total_calories: dayData.totalCal }
    }
    return a
  }

  // Entradas combinadas: análisis (corregidos con datos reales) + días con comidas pero sin análisis
  const analysisDates = new Set(analyses.map(a => a.analysis_date))
  const syntheticEntries = Object.entries(foodLogsByDay)
    .filter(([date]) => !analysisDates.has(date))
    .map(([date, data]) => ({
      id: `synthetic-${date}`,
      analysis_date: date,
      total_calories: date === todayDateStr ? todayCalories : data.totalCal,
      cal_target: adjustedCalTarget,
      analysis_text: null,
      tomorrow_plan: null,
      motivation: null,
    }))
  const allEntries = [...analyses.map(liveEntry), ...syntheticEntries]
    .sort((a, b) => b.analysis_date.localeCompare(a.analysis_date))

  // Semanas y meses usando allEntries (incluye días sin análisis)
  const allWeeks = (() => {
    const byWeek = {}
    for (const a of allEntries) {
      const date = new Date(a.analysis_date + 'T12:00:00')
      const day = date.getDay()
      const diffToMon = day === 0 ? -6 : 1 - day
      const monday = new Date(date)
      monday.setDate(date.getDate() + diffToMon)
      const key = monday.toLocaleDateString('en-CA')
      if (!byWeek[key]) byWeek[key] = { monday, entries: [] }
      byWeek[key].entries.push(a)
    }
    return Object.values(byWeek).sort((a, b) => b.monday - a.monday)
  })()
  const allMonths = (() => {
    const byMonth = {}
    for (const a of allEntries) {
      const key = a.analysis_date.slice(0, 7)
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(a)
    }
    return Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a)).map(([key, entries]) => ({ key, entries }))
  })()

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <TrendingUp size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-500">{t('progress.select_profile')}</p>
      </div>
    )
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('progress.title')}</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <BarChart3 size={48} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-gray-500 max-w-xs">
            {t('progress.no_analyses')}
          </p>
        </div>
      </div>
    )
  }

  // Stats summary — usa allEntries para incluir días con comidas aunque no tengan análisis de IA
  const avg7 = (() => {
    const cutoff = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-CA')
    const entries = allEntries.filter(a => a.analysis_date >= cutoff)
    return entries.length > 0 ? Math.round(entries.reduce((s, a) => s + a.total_calories, 0) / entries.length) : 0
  })()
  const avg30 = (() => {
    const cutoff = new Date(Date.now() - 30 * 86400000).toLocaleDateString('en-CA')
    const entries = allEntries.filter(a => a.analysis_date >= cutoff)
    return entries.length > 0 ? Math.round(entries.reduce((s, a) => s + a.total_calories, 0) / entries.length) : 0
  })()
  const calTarget = analyses[0]?.cal_target || 0
  const daysUnderTarget = allEntries.filter(a => a.total_calories <= a.cal_target).length
  const pctUnderTarget = allEntries.length > 0 ? Math.round((daysUnderTarget / allEntries.length) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <TrendingUp size={26} strokeWidth={1.75} className="text-primary-500" />
        {t('progress.title')}
      </h1>

      {/* Tab selector */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {[
          { key: 'analysis', label: t('progress.tab_analysis') },
          { key: 'weight', label: t('progress.tab_weight') },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setTab(opt.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === opt.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tab: Peso */}
      {tab === 'weight' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Card className="text-center py-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{latestWeight ?? '—'}</p>
              <p className="text-xs text-gray-400 leading-tight">{t('progress.kg_current')}</p>
            </Card>
            <Card className="text-center py-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile?.target_weight_kg ?? '—'}</p>
              <p className="text-xs text-gray-400 leading-tight">{t('progress.kg_goal')}</p>
            </Card>
          </div>
          {weightLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : weightLogs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <Scale size={48} strokeWidth={1.5} className="text-gray-300" />
              <p className="text-gray-400 text-sm">{t('progress.no_weight_records')}</p>
              <Link to="/weight" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold">
                {t('progress.log_weight')}
              </Link>
            </div>
          ) : (
            <>
              <Card>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('progress.history_label')}</p>
                <WeightChart logs={weightLogs.slice(0, 30)} targetWeight={profile?.target_weight_kg} height={160} />
              </Card>
              <Link to="/weight" className="text-sm text-primary-600 text-center py-1">
                {t('progress.view_full_history')}
              </Link>
            </>
          )}
        </div>
      )}

      {/* Tab: Análisis IA */}
      {tab === 'analysis' && <>
      {/* Tarjeta Hoy — datos en tiempo real */}
      {baseCalTarget > 0 && (() => {
        const pct = (todayCalories / baseCalTarget) * 100
        const isOver = todayCalories > adjustedCalTarget
        const isWarn = !isOver && todayCalories > baseCalTarget
        const barColor = isOver ? 'bg-red-400' : isWarn ? 'bg-amber-400' : 'bg-primary-500'
        const textColor = isOver ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-primary-600'
        return (
          <Card className="border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame size={15} strokeWidth={1.75} className="text-orange-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {lang === 'es' ? 'Hoy' : 'Today'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  · {lang === 'es' ? 'en tiempo real' : 'live'}
                </span>
              </div>
              <span className={`text-sm font-bold ${textColor}`}>{Math.round(pct)}%</span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-2xl font-bold tabular-nums ${textColor}`}>{todayCalories}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 mb-0.5">
                / {adjustedCalTarget} kcal
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            {exerciseExtraCals > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Zap size={12} strokeWidth={2} className="text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  +{exerciseExtraCals} kcal {lang === 'es' ? 'por ejercicio' : 'from exercise'}
                </span>
              </div>
            )}
          </Card>
        )
      })()}
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-primary-600">{avg7}</p>
          <p className="text-xs text-gray-400 leading-tight">{t('progress.kcal_day')}<br/>{t('progress.days_7')}</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-primary-600">{avg30}</p>
          <p className="text-xs text-gray-400 leading-tight">{t('progress.kcal_day')}<br/>{t('progress.days_30')}</p>
        </Card>
        <Card className="text-center py-3">
          <p className={`text-2xl font-bold ${pctUnderTarget >= 70 ? 'text-green-600' : pctUnderTarget >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {pctUnderTarget}%
          </p>
          <p className="text-xs text-gray-400 leading-tight">{t('progress.days_under_goal')}</p>
        </Card>
      </div>

      {calTarget > 0 && (
        <p className="text-xs text-center text-gray-400">{t('progress.calorie_meta_summary', { cal: calTarget, n: analyses.length })}</p>
      )}

      {/* View toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {[
          { key: 'weeks', label: t('progress.view_weeks') },
          { key: 'months', label: t('progress.view_months') },
          { key: 'all', label: t('progress.view_all') },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setView(opt.key)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              view === opt.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Weeks view */}
      {view === 'weeks' && allWeeks.map(({ monday, entries }) => {
        const weekAvg = Math.round(entries.reduce((s, a) => s + a.total_calories, 0) / entries.length)
        const weekTarget = entries[0]?.cal_target || 0
        const weekPct = weekTarget > 0 ? Math.round((weekAvg / weekTarget) * 100) : 0
        const trendColor = weekPct > 100 ? 'text-red-500' : weekPct >= 80 ? 'text-amber-500' : 'text-green-600'

        return (
          <div key={monday.toISOString()} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {formatWeekRange(monday, lang)}
              </p>
              <span className={`text-xs font-bold ${trendColor}`}>
                {t('progress.avg_week_summary', { avg: weekAvg, pct: weekPct })}
              </span>
            </div>
            {entries.map(a => <DayCard key={a.id} a={a} lang={lang} t={t} />)}
          </div>
        )
      })}

      {/* Months view */}
      {view === 'months' && allMonths.map(({ key, entries }) => {
        const [year, month] = key.split('-')
        const monthName = lang === 'es' ? MONTH_NAMES_ES[parseInt(month) - 1] : MONTH_NAMES_EN[parseInt(month) - 1]
        const monthAvg = Math.round(entries.reduce((s, a) => s + a.total_calories, 0) / entries.length)
        const monthTarget = entries[0]?.cal_target || 0
        const monthPct = monthTarget > 0 ? Math.round((monthAvg / monthTarget) * 100) : 0
        const trendColor = monthPct > 100 ? 'text-red-500' : monthPct >= 80 ? 'text-amber-500' : 'text-green-600'

        return (
          <div key={key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {monthName} {year}
              </p>
              <span className={`text-xs font-bold ${trendColor}`}>
                {t('progress.avg_month_summary', { avg: monthAvg, n: entries.length })}
              </span>
            </div>
            {entries.map(a => <DayCard key={a.id} a={a} lang={lang} t={t} />)}
          </div>
        )
      })}

      {/* All view */}
      {view === 'all' && allEntries.map(a => <DayCard key={a.id} a={a} lang={lang} t={t} />)}
      </>}
    </div>
  )
}

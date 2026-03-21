import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TrendingUp, BarChart3, Scale, Bot, Dumbbell, ChevronUp, ChevronDown } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { useWeightLogs } from '../../hooks/useWeightLogs'
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
  const [tab, setTab] = useState('analysis') // 'analysis' | 'weight'
  const [view, setView] = useState('weeks') // 'weeks' | 'months' | 'all'

  const profile = profiles.find(p => p.id === activeProfileId)

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <TrendingUp size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-500">{t('progress.select_profile')}</p>
      </div>
    )
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (analyses.length === 0) {
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

  // Stats summary
  const last7 = analyses.filter(a => {
    const d = new Date(a.analysis_date + 'T12:00:00')
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })
  const last30 = analyses.filter(a => {
    const d = new Date(a.analysis_date + 'T12:00:00')
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  })
  const avg7 = last7.length > 0 ? Math.round(last7.reduce((s, a) => s + a.total_calories, 0) / last7.length) : 0
  const avg30 = last30.length > 0 ? Math.round(last30.reduce((s, a) => s + a.total_calories, 0) / last30.length) : 0
  const calTarget = analyses[0]?.cal_target || 0
  const daysUnderTarget = analyses.filter(a => a.total_calories <= a.cal_target).length
  const pctUnderTarget = analyses.length > 0 ? Math.round((daysUnderTarget / analyses.length) * 100) : 0

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
      {view === 'weeks' && weeks.map(({ monday, entries }) => {
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
      {view === 'months' && months.map(({ key, entries }) => {
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
      {view === 'all' && analyses.map(a => <DayCard key={a.id} a={a} lang={lang} t={t} />)}
      </>}
    </div>
  )
}

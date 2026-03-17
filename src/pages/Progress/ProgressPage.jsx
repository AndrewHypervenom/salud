import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

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

function DayCard({ a, lang }) {
  const [open, setOpen] = useState(false)
  const pct = a.cal_target > 0 ? (a.total_calories / a.cal_target) * 100 : 0
  const statusColor = pct > 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-500' : 'text-primary-600'
  const statusIcon = pct > 100 ? '🔴' : pct >= 80 ? '🟡' : '🟢'

  return (
    <div
      className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-lg flex-shrink-0">{statusIcon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(a.analysis_date, lang)}</p>
          <CaloriePct calories={a.total_calories} target={a.cal_target} />
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${statusColor}`}>
          {Math.round(pct)}%
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
          {a.analysis_text && (
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              🤖 {a.analysis_text}
            </p>
          )}
          {a.tomorrow_plan && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-0.5">Plan siguiente día</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{a.tomorrow_plan}</p>
            </div>
          )}
          {a.motivation && (
            <p className="text-xs text-primary-600 dark:text-primary-400 italic">💪 {a.motivation}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProgressPage() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const { analyses, loading, weeks, months } = useAnalysisHistory(activeProfileId)
  const [view, setView] = useState('weeks') // 'weeks' | 'months' | 'all'

  const profile = profiles.find(p => p.id === activeProfileId)

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-5xl">📈</span>
        <p className="text-gray-500">Selecciona un perfil para ver tu progreso.</p>
      </div>
    )
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Progreso</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl">📊</span>
          <p className="text-gray-500 max-w-xs">
            Aún no hay análisis guardados. Registra tus comidas del día — el análisis se genera automáticamente al cenar.
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">📈 Progreso</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-primary-600">{avg7}</p>
          <p className="text-xs text-gray-400 leading-tight">kcal/día<br/>7 días</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-primary-600">{avg30}</p>
          <p className="text-xs text-gray-400 leading-tight">kcal/día<br/>30 días</p>
        </Card>
        <Card className="text-center py-3">
          <p className={`text-2xl font-bold ${pctUnderTarget >= 70 ? 'text-green-600' : pctUnderTarget >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {pctUnderTarget}%
          </p>
          <p className="text-xs text-gray-400 leading-tight">días bajo<br/>la meta</p>
        </Card>
      </div>

      {calTarget > 0 && (
        <p className="text-xs text-center text-gray-400">Meta calórica: {calTarget} kcal/día · {analyses.length} días registrados</p>
      )}

      {/* View toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {[
          { key: 'weeks', label: 'Semanas' },
          { key: 'months', label: 'Meses' },
          { key: 'all', label: 'Todo' },
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
                {weekAvg} kcal/día ({weekPct}%)
              </span>
            </div>
            {entries.map(a => <DayCard key={a.id} a={a} lang={lang} />)}
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
                {monthAvg} kcal/día · {entries.length} días
              </span>
            </div>
            {entries.map(a => <DayCard key={a.id} a={a} lang={lang} />)}
          </div>
        )
      })}

      {/* All view */}
      {view === 'all' && analyses.map(a => <DayCard key={a.id} a={a} lang={lang} />)}
    </div>
  )
}

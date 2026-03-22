import { useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { ProgressRing } from '../ui/ProgressRing'

const DIFF_STYLES = {
  easy:   { iconBg: 'bg-green-100 dark:bg-green-900/30',   iconColor: 'text-green-600 dark:text-green-400',   pill: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',   ring: '#16a34a' },
  medium: { iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400', pill: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', ring: '#ca8a04' },
  hard:   { iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400', pill: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', ring: '#ea580c' },
  elite:  { iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400', pill: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', ring: '#9333ea' },
}

export function BadgeDetailModal({ badge, record, stat, lang, onClose, t }) {
  const isUnlocked = !!record
  const hasProgress = !!stat && !isUnlocked

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!badge) return null

  const label  = lang === 'es' ? badge.label_es  : badge.label_en
  const desc   = lang === 'es' ? badge.desc_es   : badge.desc_en
  const detail = lang === 'es' ? badge.detail_es : badge.detail_en
  const diff   = DIFF_STYLES[badge.difficulty] || DIFF_STYLES.easy
  const BadgeIcon = badge.Icon

  const unlockedDate = record?.created_at
    ? new Date(record.created_at).toLocaleDateString(
        lang === 'es' ? 'es-CR' : 'en-US',
        { day: '2-digit', month: 'long', year: 'numeric' }
      )
    : null

  const diffLabel = t(`badges.difficulty.${badge.difficulty}`)
  const catLabel  = t(`badges.categories.${badge.category}`)
  const howToLabel   = lang === 'es' ? '¿Cómo obtenerlo?' : 'How to earn it'
  const progressLabel = lang === 'es' ? 'Tu progreso' : 'Your progress'
  const unlockedLabel = lang === 'es' ? `Obtenido el ${unlockedDate}` : `Earned on ${unlockedDate}`
  const closeLabel    = lang === 'es' ? 'Cerrar' : 'Close'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-fade-in-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl animate-slide-up-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-modal-title"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Scrollable content */}
        <div className="px-6 pb-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto no-scrollbar">

          {/* Header: icon + title + pills */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${diff.iconBg}`}>
              {BadgeIcon && (
                <BadgeIcon
                  size={32}
                  strokeWidth={1.5}
                  className={isUnlocked ? 'text-yellow-500 dark:text-yellow-400' : diff.iconColor}
                />
              )}
            </div>

            <h2
              id="badge-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center leading-tight"
            >
              {label}
            </h2>

            <div className="flex gap-2 flex-wrap justify-center">
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                {catLabel}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${diff.pill}`}>
                {diffLabel}
              </span>
            </div>

            {isUnlocked && unlockedDate && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full">
                <Trophy size={12} />
                {unlockedLabel}
              </span>
            )}
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* How to earn */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {howToLabel}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {desc}
            </p>
          </div>

          {/* Narrative detail */}
          {detail && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                {detail}
              </p>
            </div>
          )}

          {/* Progress ring (only for progressive locked badges) */}
          {hasProgress && (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {progressLabel}
              </p>
              <ProgressRing
                percent={(stat.current / stat.total) * 100}
                size={80}
                strokeWidth={7}
                color={diff.ring}
              >
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(stat.current)}/{stat.total}
                </span>
              </ProgressRing>
            </div>
          )}

          {/* Close button */}
          <button
            autoFocus
            onClick={onClose}
            aria-label={closeLabel}
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

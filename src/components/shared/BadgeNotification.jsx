import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * BadgeNotification — toast de celebración al desbloquear un logro
 * Props: badge ({key, emoji, label_es, label_en}), onDismiss, lang
 */
export function BadgeNotification({ badge, onDismiss, lang = 'es' }) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!badge) return
    const id = setTimeout(() => onDismiss?.(), 3500)
    return () => clearTimeout(id)
  }, [badge, onDismiss])

  if (!badge) return null

  const label = lang === 'es' ? badge.label_es : badge.label_en

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-5 py-4 animate-slide-down border border-yellow-200 dark:border-yellow-800"
      style={{ minWidth: 260 }}
    >
      <span className="text-4xl">{badge.emoji}</span>
      <div>
        <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
          {t('badges.unlock_title')}
        </p>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{label}</p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-auto text-gray-300 hover:text-gray-500 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

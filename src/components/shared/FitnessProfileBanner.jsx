import { useTranslation } from 'react-i18next'
import { Target } from 'lucide-react'

export default function FitnessProfileBanner({ onStart, onDismiss }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md text-white">
          <Target size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-violet-900 dark:text-violet-100 text-sm leading-tight">
            {t('fitness.banner_title')}
          </p>
          <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5 leading-snug">
            {t('fitness.banner_desc')}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onStart}
              className="px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
            >
              {t('fitness.banner_cta')}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-violet-500 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-200 transition-colors"
            >
              {t('fitness.banner_dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

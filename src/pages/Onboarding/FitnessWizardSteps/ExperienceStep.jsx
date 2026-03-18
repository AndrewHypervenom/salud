import { useTranslation } from 'react-i18next'

const LEVELS = [
  {
    id: 'beginner',
    emoji: '🌱',
    color: 'from-green-400 to-emerald-500',
    selected: 'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20 border-green-400',
    border: 'border-green-200 dark:border-green-700',
    bg: 'bg-green-50/50 dark:bg-green-900/10',
  },
  {
    id: 'intermediate',
    emoji: '⚡',
    color: 'from-amber-400 to-orange-500',
    selected: 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-400',
    border: 'border-amber-200 dark:border-amber-700',
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
  },
  {
    id: 'advanced',
    emoji: '🔥',
    color: 'from-red-400 to-rose-500',
    selected: 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20 border-red-400',
    border: 'border-red-200 dark:border-red-700',
    bg: 'bg-red-50/50 dark:bg-red-900/10',
  },
]

export default function ExperienceStep({ value, onChange }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_experience')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('fitness.experience_hint')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {LEVELS.map(lvl => {
          const isSelected = value === lvl.id
          return (
            <button
              key={lvl.id}
              onClick={() => onChange(lvl.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 text-left ${
                isSelected ? lvl.selected : `${lvl.bg} ${lvl.border} hover:scale-[1.01]`
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
                {lvl.emoji}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {t(`fitness.level_${lvl.id}`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                  {t(`fitness.level_${lvl.id}_desc`)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

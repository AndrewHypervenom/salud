import { useTranslation } from 'react-i18next'

const GOALS = [
  {
    id: 'lose_weight',
    emoji: '⬇️',
    color: 'from-teal-500 to-cyan-500',
    border: 'border-teal-300 dark:border-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    selected: 'ring-2 ring-teal-400 bg-teal-50 dark:bg-teal-900/30 border-teal-400',
  },
  {
    id: 'gain_muscle',
    emoji: '💪',
    color: 'from-purple-500 to-violet-500',
    border: 'border-purple-300 dark:border-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    selected: 'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-400',
  },
  {
    id: 'maintain',
    emoji: '⚖️',
    color: 'from-green-500 to-emerald-500',
    border: 'border-green-300 dark:border-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    selected: 'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/30 border-green-400',
  },
  {
    id: 'improve_health',
    emoji: '❤️',
    color: 'from-rose-400 to-pink-500',
    border: 'border-rose-300 dark:border-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    selected: 'ring-2 ring-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-400',
  },
]

export default function GoalStep({ values, onChange, onContinue }) {
  const { t } = useTranslation()

  const toggle = (id) => {
    if (values.includes(id)) {
      onChange(values.filter(v => v !== id))
    } else {
      onChange([...values, id])
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_goal')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fitness.goal_select_hint')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => {
          const isSelected = values.includes(g.id)
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all active:scale-95 ${
                isSelected
                  ? g.selected
                  : `${g.bg} ${g.border} hover:scale-[1.02]`
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-center text-2xl shadow-md`}>
                {g.emoji}
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">
                  {t(`fitness.goal_${g.id}`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                  {t(`fitness.goal_${g.id}_desc`)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
      <button
        onClick={onContinue}
        disabled={values.length === 0}
        className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-40 active:scale-95 transition-all shadow-md"
      >
        {t('common.continue')}
      </button>
    </div>
  )
}

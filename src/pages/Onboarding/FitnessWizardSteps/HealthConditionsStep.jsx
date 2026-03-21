import { useTranslation } from 'react-i18next'
import { HeartPulse } from 'lucide-react'

const CONDITIONS = [
  { id: 'high_blood_pressure', emoji: '🩺' },
  { id: 'diabetes',            emoji: '🩸' },
  { id: 'high_cholesterol',    emoji: '🫀' },
  { id: 'water_retention',     emoji: '💧' },
  { id: 'joint_pain',          emoji: '🦵' },
  { id: 'migraines',           emoji: '🤕' },
  { id: 'digestive_issues',    emoji: '🫃' },
  { id: 'chronic_fatigue',     emoji: '😮‍💨' },
  { id: 'anxiety_stress',      emoji: '🧠' },
  { id: 'insomnia',            emoji: '🌙' },
]

export default function HealthConditionsStep({ conditions, onConditionsChange, onNext }) {
  const { t } = useTranslation()

  const toggle = (id) => {
    onConditionsChange({ ...conditions, [id]: !conditions[id] })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
            <HeartPulse size={28} strokeWidth={1.75} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_health_conditions')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fitness.health_conditions_hint')}</p>
      </div>

      {/* Grid de condiciones */}
      <div className="grid grid-cols-2 gap-2">
        {CONDITIONS.map(cond => {
          const isSelected = !!conditions[cond.id]
          return (
            <button
              key={cond.id}
              onClick={() => toggle(cond.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all active:scale-95 text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-xl flex-shrink-0">{cond.emoji}</span>
              <p className={`font-semibold text-xs leading-tight ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                {t(`fitness.cond_${cond.id}`)}
              </p>
            </button>
          )
        })}
      </div>

      {/* Nota de privacidad */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        🔒 {t('fitness.health_conditions_privacy')}
      </p>

      <button
        onClick={onNext}
        className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-md"
      >
        {t('welcome.continue')}
      </button>
    </div>
  )
}

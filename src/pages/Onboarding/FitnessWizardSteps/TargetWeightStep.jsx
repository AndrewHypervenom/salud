import { useTranslation } from 'react-i18next'

const SPEEDS = [
  { id: 'slow',     emoji: '🐢' },
  { id: 'moderate', emoji: '🚶' },
  { id: 'fast',     emoji: '🏃' },
]

export default function TargetWeightStep({ targetWeight, onTargetChange, goalSpeed, onSpeedChange, profileData, onNext }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_target')}</h2>
        {profileData?.weight_kg && (
          <p className="text-sm text-gray-500 mt-1">
            {t('fitness.target_weight_hint', { weight: profileData.weight_kg })}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('fitness.target_weight_label')}
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="20"
          max="300"
          value={targetWeight}
          onChange={e => onTargetChange(e.target.value)}
          placeholder="65"
          className="w-full px-4 py-3 text-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-center font-bold"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fitness.goal_speed_title')}</p>
        <div className="flex gap-2">
          {SPEEDS.map(s => {
            const isSelected = goalSpeed === s.id
            return (
              <button
                key={s.id}
                onClick={() => onSpeedChange(s.id)}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <div className="text-center">
                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t(`fitness.speed_${s.id}`)}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {t(`fitness.speed_${s.id}_desc`)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-md"
      >
        {t('welcome.continue')}
      </button>
    </div>
  )
}

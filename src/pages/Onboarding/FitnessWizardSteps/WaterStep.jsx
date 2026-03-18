import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function calcSuggestedWater(weight_kg) {
  if (!weight_kg) return 2000
  return Math.min(4000, Math.max(1500, Math.round(weight_kg * 30 / 100) * 100))
}

export default function WaterStep({ profileData, waterGoal, onWaterChange, onComplete }) {
  const { t } = useTranslation()
  const suggested = calcSuggestedWater(profileData?.weight_kg)
  const [custom, setCustom] = useState(waterGoal || suggested)

  const handleUseSuggested = () => {
    onWaterChange(suggested)
    onComplete(suggested)
  }

  const handleCustomSubmit = () => {
    const val = parseInt(custom) || 2000
    onWaterChange(val)
    onComplete(val)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_water')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('fitness.water_based_on')}</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center border border-blue-100 dark:border-blue-800">
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
          {suggested}
          <span className="text-xl font-normal ml-1 text-blue-400">ml</span>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
          {t('fitness.water_suggested', { ml: suggested })}
        </p>
      </div>

      <button
        onClick={handleUseSuggested}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md"
      >
        💧 {t('fitness.water_use_suggested')}
      </button>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-500 text-center">{t('common.optional')}</label>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            step="100"
            min="500"
            max="5000"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-center font-bold"
          />
          <button
            onClick={handleCustomSubmit}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all text-sm"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { UtensilsCrossed } from 'lucide-react'

const DIET_TYPES = [
  { id: 'omnivore',    emoji: '🥩', labelKey: 'fitness.diet_omnivore',    descKey: 'fitness.diet_omnivore_desc' },
  { id: 'vegetarian',  emoji: '🥗', labelKey: 'fitness.diet_vegetarian',  descKey: 'fitness.diet_vegetarian_desc' },
  { id: 'vegan',       emoji: '🌱', labelKey: 'fitness.diet_vegan',       descKey: 'fitness.diet_vegan_desc' },
  { id: 'keto',        emoji: '🥑', labelKey: 'fitness.diet_keto',        descKey: 'fitness.diet_keto_desc' },
  { id: 'none',        emoji: '🍚', labelKey: 'fitness.diet_none',        descKey: 'fitness.diet_none_desc' },
]

const RESTRICTIONS = [
  { id: 'dairy',    labelKey: 'fitness.restriction_dairy' },
  { id: 'gluten',   labelKey: 'fitness.restriction_gluten' },
  { id: 'seafood',  labelKey: 'fitness.restriction_seafood' },
  { id: 'nuts',     labelKey: 'fitness.restriction_nuts' },
  { id: 'eggs',     labelKey: 'fitness.restriction_eggs' },
  { id: 'none',     labelKey: 'fitness.restriction_none' },
]

export default function DietStep({
  dietaryPreference,
  onDietaryPreferenceChange,
  foodRestrictions,
  onFoodRestrictionsChange,
  onNext,
}) {
  const { t } = useTranslation()

  const toggleRestriction = (id) => {
    if (id === 'none') {
      onFoodRestrictionsChange(['none'])
      return
    }
    const filtered = foodRestrictions.filter(r => r !== 'none')
    if (filtered.includes(id)) {
      onFoodRestrictionsChange(filtered.filter(r => r !== id))
    } else {
      onFoodRestrictionsChange([...filtered, id])
    }
  }

  const canContinue = dietaryPreference !== null

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
            <UtensilsCrossed size={28} strokeWidth={1.75} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_diet')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fitness.diet_hint')}</p>
      </div>

      {/* Tipo de dieta */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fitness.diet_type_q')}</p>
        <div className="flex flex-col gap-2">
          {DIET_TYPES.map(diet => {
            const isSelected = dietaryPreference === diet.id
            return (
              <button
                key={diet.id}
                onClick={() => onDietaryPreferenceChange(diet.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all active:scale-95 text-left ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{diet.emoji}</span>
                <div>
                  <p className={`font-semibold text-sm ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {t(diet.labelKey)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t(diet.descKey)}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Restricciones / alergias */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fitness.restrictions_q')}</p>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map(res => {
            const isSelected = foodRestrictions.includes(res.id)
            return (
              <button
                key={res.id}
                onClick={() => toggleRestriction(res.id)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t(res.labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-40 active:scale-95 transition-all shadow-md"
      >
        {t('welcome.continue')}
      </button>
    </div>
  )
}

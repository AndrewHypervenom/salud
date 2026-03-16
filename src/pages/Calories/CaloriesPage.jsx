import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { calcBMR, calcTDEE, calcMacros, getActivityMultiplier } from '../../lib/formulas'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

function MacroBar({ label, kcal, grams, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500">{kcal} kcal · {grams}g</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default function CaloriesPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading } = useProfiles()

  const profile = profiles.find(p => p.id === activeProfileId)

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (!profile) {
    return (
      <Card className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-3">🔥</p>
        <p>{t('calories.no_profile')}</p>
      </Card>
    )
  }

  const bmr = calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
  const tdee = calcTDEE(bmr, profile.activity)
  const macros = calcMacros(tdee)
  const multiplier = getActivityMultiplier(profile.activity)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('calories.title')}</h1>
        <p className="text-gray-500">{profile.name} · {t('calories.subtitle')}</p>
      </div>

      {/* Main TDEE */}
      <Card className="text-center bg-primary-600 text-white">
        <p className="text-sm font-medium opacity-80 mb-1">{t('calories.tdee')}</p>
        <p className="text-5xl font-bold">{tdee}</p>
        <p className="text-sm opacity-80 mt-1">{t('calories.kcal')}</p>
      </Card>

      {/* BMR + Activity */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500">{t('calories.bmr')}</span>
          <span className="font-semibold">{Math.round(bmr)} kcal</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{t('calories.activity_factor')}</span>
          <span className="font-semibold">×{multiplier}</span>
        </div>
        <div className="mt-3 pt-3 border-t dark:border-gray-700 text-xs text-gray-400 text-center">{t('calories.formula')}</div>
      </Card>

      {/* Macros */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Macronutrientes</h2>
        <div className="flex flex-col gap-4">
          <MacroBar
            label={t('calories.protein')}
            kcal={macros.protein_kcal}
            grams={macros.protein_g}
            percent={25}
            color="bg-blue-500"
          />
          <MacroBar
            label={t('calories.fat')}
            kcal={macros.fat_kcal}
            grams={macros.fat_g}
            percent={30}
            color="bg-yellow-500"
          />
          <MacroBar
            label={t('calories.carbs')}
            kcal={macros.carbs_kcal}
            grams={macros.carbs_g}
            percent={45}
            color="bg-green-500"
          />
        </div>
      </Card>
    </div>
  )
}

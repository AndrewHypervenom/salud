import { useTranslation } from 'react-i18next'
import { CheckCircle2, Ban, Lightbulb, Flame, History } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useFoodLogs, useRecentFoodLogs } from '../../hooks/useFoodLogs'
import { useExerciseLogs } from '../../hooks/useExerciseLogs'
import { calcBMR, calcTDEE, calcCalorieTarget, getCalorieStatus, CALORIE_COLORS } from '../../lib/formulas'

function ListSection({ title, items, Icon, iconClass, itemColor }) {
  if (!items || items.length === 0) return null
  return (
    <Card>
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Icon size={18} strokeWidth={1.75} className={iconClass} /> {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${itemColor}`}>
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function DietPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading } = useProfiles()
  const { todayCalories } = useFoodLogs(activeProfileId)
  const { todayCaloriesBurned } = useExerciseLogs(activeProfileId)
  const { recentFoods, loading: loadingRecent } = useRecentFoodLogs(activeProfileId)

  const profile = profiles.find(p => p.id === activeProfileId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        {t('common.loading', 'Cargando...')}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('diet.title')}</h1>
        </div>
        <Card>
          <p className="text-sm text-gray-500 text-center py-4">{t('diet.no_profile')}</p>
        </Card>
      </div>
    )
  }

  const healthGoal = profile.health_goal ?? 'improve_health'
  const bmr = calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
  const tdee = calcTDEE(bmr, profile.activity)
  const target = calcCalorieTarget(tdee, healthGoal)
  const remaining = target - todayCalories + todayCaloriesBurned
  const status = getCalorieStatus(todayCalories, target)
  const colors = CALORIE_COLORS[status]
  const progressPct = Math.min((todayCalories / target) * 100, 100)

  const eatItems = t(`diet.goal.${healthGoal}.eat`, { returnObjects: true }) ?? []
  const avoidItems = t(`diet.goal.${healthGoal}.avoid`, { returnObjects: true }) ?? []
  const tipItems = t(`diet.goal.${healthGoal}.tips`, { returnObjects: true }) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('diet.title')}</h1>
        <p className="text-gray-500 text-sm">
          {profile.name} · {t(`diet.goal_label.${healthGoal}`, healthGoal)}
        </p>
      </div>

      {/* Calorie summary */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={18} strokeWidth={1.75} className="text-orange-500" />
          <h2 className="font-bold text-gray-900 dark:text-gray-100">
            {t('diet.calorie_target')}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('diet.calorie_target')}</p>
            <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{target}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('diet.consumed_today')}</p>
            <p className={`font-bold text-lg ${colors.text}`}>{todayCalories}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('diet.burned_today')}</p>
            <p className="font-bold text-lg text-green-600">+{todayCaloriesBurned}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full transition-all ${colors.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className={`text-sm font-semibold text-center ${remaining >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-red-600'}`}>
          {remaining >= 0
            ? t('diet.remaining', { n: remaining })
            : t('diet.over', { n: Math.abs(remaining) })}
        </p>
      </Card>

      {/* Goal-based recommendations */}
      <ListSection
        title={t('diet.section_eat')}
        items={eatItems}
        Icon={CheckCircle2}
        iconClass="text-green-600"
        itemColor="text-green-700 dark:text-green-400"
      />
      <ListSection
        title={t('diet.section_avoid')}
        items={avoidItems}
        Icon={Ban}
        iconClass="text-red-500"
        itemColor="text-red-700 dark:text-red-400"
      />
      <ListSection
        title={t('diet.section_tips')}
        items={tipItems}
        Icon={Lightbulb}
        iconClass="text-blue-500"
        itemColor="text-blue-700 dark:text-blue-400"
      />

      {/* Recent foods */}
      <Card>
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <History size={18} strokeWidth={1.75} className="text-gray-500" />
          {t('diet.frequent_foods')}
        </h2>
        {loadingRecent ? (
          <p className="text-sm text-gray-400">{t('common.loading', 'Cargando...')}</p>
        ) : recentFoods.length === 0 ? (
          <p className="text-sm text-gray-400">{t('diet.no_frequent_foods')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentFoods.map(f => (
              <Badge key={f.description} className="text-xs">
                {f.description}
                <span className="ml-1 opacity-60">×{f.count}</span>
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

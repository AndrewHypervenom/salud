import { useTranslation } from 'react-i18next'
import { CheckCircle2, Ban, Lightbulb, Flame, History, Zap, TrendingUp } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useFoodLogs, useRecentFoodLogs } from '../../hooks/useFoodLogs'
import { useExerciseLogs } from '../../hooks/useExerciseLogs'
import { calcBMR, calcTDEE, calcCalorieTarget, calcExerciseEatBack, getCalorieStatus, CALORIE_COLORS } from '../../lib/formulas'
import { FridgeAssistant } from '../../components/shared/FridgeAssistant'

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
  const { extraCals, eatBackPct } = calcExerciseEatBack(todayCaloriesBurned, healthGoal)
  const adjustedTarget = target + extraCals
  const remaining = adjustedTarget - todayCalories
  const status = getCalorieStatus(todayCalories, adjustedTarget)
  const colors = CALORIE_COLORS[status]
  const progressPct = Math.min((todayCalories / adjustedTarget) * 100, 100)

  const eatItems = t(`diet.goal.${healthGoal}.eat`, { returnObjects: true }) ?? []
  const avoidItems = t(`diet.goal.${healthGoal}.avoid`, { returnObjects: true }) ?? []
  const tipItems = t(`diet.goal.${healthGoal}.tips`, { returnObjects: true }) ?? []

  // Header gradient based on calorie status
  const headerGradient = status === 'over'
    ? 'from-rose-500 to-orange-500'
    : status === 'warn'
    ? 'from-amber-500 to-orange-400'
    : 'from-emerald-500 to-teal-500'

  // Max frequency for relative bar
  const maxCount = recentFoods.length > 0 ? Math.max(...recentFoods.map(f => f.count)) : 1

  return (
    <div className="flex flex-col gap-4">

      {/* ── HEADER ── */}
      <div
        className={`-mx-4 -mt-4 px-4 pt-6 pb-5 bg-gradient-to-r ${headerGradient} text-white`}
        style={{ borderRadius: '0 0 24px 24px' }}
      >
        <p className="text-sm text-white/80 mb-1">{profile.name} · {t(`diet.goal_label.${healthGoal}`, healthGoal)}</p>
        <h1 className="text-2xl font-bold mb-3">{t('diet.title')}</h1>

        <div className="flex items-end gap-3">
          <div>
            <p className="text-white/70 text-xs mb-0.5">{t('diet.consumed_today')}</p>
            <p className="text-4xl font-bold tabular-nums">{todayCalories}</p>
            <p className="text-white/70 text-xs mt-0.5">kcal consumidas</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-white/70 text-xs">Puedes comer hoy</p>
            <p className={`text-3xl font-bold tabular-nums ${remaining < 0 ? 'text-red-200' : ''}`}>
              {remaining >= 0 ? remaining.toLocaleString() : '0'}
            </p>
            {todayCaloriesBurned > 0 ? (
              <p className="text-xs text-yellow-200 flex items-center justify-end gap-1">
                <Zap size={10} /> +{extraCals} kcal ejercicio ({eatBackPct}%)
              </p>
            ) : (
              <p className="text-xs text-white/60">de {target.toLocaleString()} kcal</p>
            )}
          </div>
        </div>
      </div>

      {/* ── CALORIE PROGRESS CARD ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={18} strokeWidth={1.75} className="text-orange-500" />
          <h2 className="font-bold text-gray-900 dark:text-gray-100">
            {t('diet.calorie_target')}
          </h2>
          {todayCaloriesBurned > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
              <Zap size={10} /> +{extraCals} kcal ({eatBackPct}%)
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Puedes comer</p>
            <p className={`font-bold text-lg ${remaining < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
              {remaining >= 0 ? remaining.toLocaleString() : '0'}
            </p>
            <p className="text-xs text-gray-400">kcal hoy</p>
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

      {/* ── FRIDGE ASSISTANT ── */}
      <FridgeAssistant
        profile={profile}
        calTarget={adjustedTarget}
        remainingCalories={remaining}
      />

      {/* ── GOAL RECOMMENDATIONS ── */}
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

      {/* ── FREQUENT FOODS ── */}
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
          <div className="flex flex-col gap-2">
            {recentFoods.map(f => {
              const pct = Math.round((f.count / maxCount) * 100)
              return (
                <div key={f.description} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{f.description}</p>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0 flex items-center gap-0.5">
                        <TrendingUp size={10} /> {t('diet.frequent_foods_count', { n: f.count })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

    </div>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../context/ProfileContext'
import { useProfiles } from '../hooks/useProfiles'
import { useBloodPressure } from '../hooks/useBloodPressure'
import { useDoctorQuestions } from '../hooks/useDoctorQuestions'
import { useHabits } from '../hooks/useHabits'
import { useFoodLogs } from '../hooks/useFoodLogs'
import { calcBMR, calcTDEE, calcCalorieTarget, getCalorieStatus, CALORIE_COLORS } from '../lib/formulas'
import { classifyBP } from '../lib/bpStatus'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { HealthCoach } from '../components/shared/HealthCoach'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export default function Dashboard() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading } = useProfiles()
  const { readings } = useBloodPressure(activeProfileId)
  const { questions } = useDoctorQuestions(activeProfileId)
  const { habits, todayLogs: habitLogs } = useHabits(activeProfileId)
  const { todayCalories, todayLogs } = useFoodLogs(activeProfileId)

  const profile = profiles.find(p => p.id === activeProfileId)

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-6xl">💚</span>
        <h1 className="text-2xl font-bold text-gray-900">{t('app_title')}</h1>
        <p className="text-gray-500 max-w-xs">{t('dashboard.select_profile')}</p>
      </div>
    )
  }

  const bmr = calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
  const tdee = calcTDEE(bmr, profile.activity)
  const calTarget = calcCalorieTarget(tdee, profile.health_goal)

  const lastBP = readings[0]
  const bpClass = lastBP ? classifyBP(lastBP.systolic, lastBP.diastolic) : null
  const bpStatusKey = bpClass ? `bp.status_${bpClass.status}` : null

  const pendingQuestions = questions.filter(q => !q.is_checked).length
  const completedHabits = habits.filter(h => habitLogs.some(l => l.habit_id === h.id)).length
  const habitProgress = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0

  const calorieStatus = getCalorieStatus(todayCalories, calTarget)
  const calColors = CALORIE_COLORS[calorieStatus]
  const caloriePercent = calTarget > 0 ? Math.min((todayCalories / calTarget) * 100, 100) : 0
  const caloriesLeft = calTarget - todayCalories

  const loggedMeals = new Set(todayLogs.map(l => l.meal_type))
  const mealCalories = (mealType) => todayLogs
    .filter(l => l.meal_type === mealType)
    .reduce((sum, l) => sum + (l.calories_estimated || 0), 0)

  const motivationKey = todayCalories === 0
    ? 'dashboard.motivation_empty'
    : calorieStatus === 'over' ? 'dashboard.motivation_over'
    : calorieStatus === 'warn' ? 'dashboard.motivation_warn'
    : 'dashboard.motivation_ok'

  const goalKey = profile.health_goal === 'lose_weight'
    ? 'dashboard.goal_lose_weight'
    : profile.health_goal === 'gain_muscle'
    ? 'dashboard.goal_gain_muscle'
    : 'dashboard.goal_maintain'

  const goalBadgeClass = profile.health_goal === 'lose_weight'
    ? 'bg-blue-100 text-blue-700'
    : profile.health_goal === 'gain_muscle'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-green-100 text-green-700'

  return (
    <div className="flex flex-col gap-4">

      {/* Bloque 1 — Header */}
      <div className="flex items-center gap-3">
        <Link to={`/profiles/${profile.id}/edit`}>
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl hover:ring-2 hover:ring-primary-400 transition-all">
            {profile.name[0].toUpperCase()}
          </div>
        </Link>
        <div>
          <p className="text-sm text-gray-500">{t('dashboard.welcome')}</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h1>
        </div>
      </div>

      {/* Bloque 2 — Tarjeta principal de calorías */}
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{t('dashboard.calories_today')}</p>
            <p className={`text-4xl font-bold ${calColors.text}`}>
              {todayCalories}
              <span className="text-lg font-normal text-gray-400"> / {calTarget} kcal</span>
              {calorieStatus === 'over' && <span className="ml-1 text-lg">⚠️</span>}
            </p>
            <p className="text-sm text-gray-500 mt-1">{t(motivationKey)}</p>
          </div>
          <Badge className={goalBadgeClass}>{t(goalKey)}</Badge>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${calColors.bar}`}
            style={{ width: `${caloriePercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          {calorieStatus === 'over'
            ? t('dashboard.calories_over', { n: Math.abs(caloriesLeft) })
            : t('dashboard.calories_remaining', { n: caloriesLeft })}
        </p>
      </Card>

      {/* Bloque 3 — Botón de acción rápida */}
      <Link to="/food">
        <Button className="w-full py-4 text-base">🍽️ {t('dashboard.log_food_btn')}</Button>
      </Link>

      {/* Bloque 4 — Grid 2x2 de comidas */}
      <div className="grid grid-cols-2 gap-3">
        {MEAL_TYPES.map(meal => {
          const hasLogs = loggedMeals.has(meal)
          const kcal = mealCalories(meal)
          return (
            <Link key={meal} to="/food">
              <Card className={`hover:shadow-lg transition-shadow ${hasLogs ? 'border-2 border-primary-400' : 'border-2 border-dashed border-gray-200 dark:border-gray-600'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{MEAL_ICONS[meal]}</span>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t(`food.${meal}`)}</p>
                </div>
                {hasLogs ? (
                  <p className="text-sm font-bold text-primary-600">{kcal} kcal</p>
                ) : (
                  <p className="text-xs text-gray-400">{t('dashboard.meal_missing')}</p>
                )}
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Bloque 5 — Coach IA */}
      <HealthCoach
        profileId={activeProfileId}
        profile={profile}
        calTarget={calTarget}
        todayCalories={todayCalories}
        foodLogs={todayLogs}
        habits={habits}
        habitLogs={habitLogs}
        lastBP={lastBP}
      />

      {/* Bloque 6 — Habits */}
      <Link to="/habits">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.habits_today')}</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {completedHabits}<span className="text-gray-400"> / {habits.length}</span>
            </p>
          </div>
          {habits.length > 0 && (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${habitProgress >= 100 ? 'bg-green-500' : habitProgress > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                  style={{ width: `${habitProgress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {habits.slice(0, 5).map(h => {
                  const done = habitLogs.some(l => l.habit_id === h.id)
                  return (
                    <span
                      key={h.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {h.emoji} {h.name}
                    </span>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      </Link>

      {/* Bloque 7 — Métricas secundarias */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/blood-pressure">
          <Card className="hover:shadow-lg transition-shadow h-full">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 font-medium">{t('dashboard.last_bp')}</p>
              <span className="text-lg">❤️</span>
            </div>
            {lastBP ? (
              <>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{lastBP.systolic}/{lastBP.diastolic}</p>
                <p className="text-xs text-gray-400 mb-1">{t('bp.mmhg')}</p>
                {bpClass && <Badge className={bpClass.badgeClass}>{t(bpStatusKey)}</Badge>}
              </>
            ) : (
              <p className="text-sm text-gray-400">{t('dashboard.no_bp')}</p>
            )}
          </Card>
        </Link>

        <Link to="/doctor-questions">
          <Card className="hover:shadow-lg transition-shadow h-full">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 font-medium">{t('dashboard.doctor_questions')}</p>
              <span className="text-lg">👨‍⚕️</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pendingQuestions}</p>
            <p className="text-xs text-gray-400">{t('dashboard.questions_pending')}</p>
          </Card>
        </Link>
      </div>

    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useHabits } from '../../hooks/useHabits'
import { useFoodLogs } from '../../hooks/useFoodLogs'
import { calcBMR, calcTDEE, calcCalorieTarget, getCalorieStatus, CALORIE_COLORS } from '../../lib/formulas'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { FoodEntryForm } from './FoodEntryForm'
import { WhatsAppAlerts } from '../../components/shared/WhatsAppAlerts'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

export default function FoodPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const { todayLogs, loading, todayCalories, addFoodLog, deleteFoodLog } = useFoodLogs(activeProfileId)
  const { habits, todayLogs: habitLogs } = useHabits(activeProfileId)

  const [openForm, setOpenForm] = useState(null) // meal_type string or null
  const [deleting, setDeleting] = useState(null)

  const profile = profiles.find(p => p.id === activeProfileId)
  const tdee = profile
    ? calcTDEE(calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex), profile.activity)
    : 0
  const calTarget = profile ? calcCalorieTarget(tdee, profile.health_goal) : 0

  const caloriePercent = calTarget > 0 ? Math.min((todayCalories / calTarget) * 100, 100) : 0
  const overGoal = todayCalories > calTarget
  const calorieStatus = getCalorieStatus(todayCalories, calTarget)
  const calColors = CALORIE_COLORS[calorieStatus]
  const caloriesLeft = calTarget - todayCalories

  const logsForMeal = (meal) => todayLogs.filter(l => l.meal_type === meal)

  const handleSave = async (data) => {
    await addFoodLog(data)
    setOpenForm(null)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try { await deleteFoodLog(id) } catch (e) { console.error(e) }
    setDeleting(null)
  }

  const completedHabits = habits.filter(h => habitLogs.some(l => l.habit_id === h.id)).length
  const foodSummary = profile
    ? `Comidas de ${profile.name} hoy: ${todayCalories} kcal de ${calTarget} kcal meta.\n${MEAL_TYPES.map(m => {
        const logs = logsForMeal(m)
        return logs.length ? `${MEAL_ICONS[m]} ${t(`food.${m}`)}: ${logs.map(l => l.description).join(', ')}` : null
      }).filter(Boolean).join('\n')}`
    : ''

  const daySummary = profile
    ? `Resumen de ${profile.name} hoy:\n✅ Hábitos: ${completedHabits}/${habits.length}\n🍽️ Calorías: ${todayCalories}/${calTarget} kcal`
    : ''

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-5xl">🍽️</span>
        <p className="text-gray-500">{t('food.no_profile')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('food.title')}</h1>
      </div>

      {/* Calorie progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">{t('food.today_calories')}</p>
            <p className={`text-3xl font-bold ${calColors.text}`}>
              {todayCalories}
              <span className="text-base font-normal text-gray-400"> / {calTarget} kcal</span>
              {calorieStatus === 'over' && <span className="ml-1 text-base">⚠️</span>}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {calorieStatus === 'over'
                ? `Superaste por ${Math.abs(caloriesLeft)} kcal`
                : caloriePercent >= 100
                  ? '¡Meta cumplida! 🎯'
                  : `Te quedan ${caloriesLeft} kcal`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl">🔥</span>
            <p className={`text-sm font-semibold ${calColors.text}`}>{Math.round(caloriePercent)}%</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${calColors.bar}`}
            style={{ width: `${caloriePercent}%` }}
          />
        </div>
      </Card>

      {/* Meal sections */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        MEAL_TYPES.map(meal => (
          <div key={meal}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <span>{MEAL_ICONS[meal]}</span> {t(`food.${meal}`)}
                {logsForMeal(meal).length > 0 && (
                  <span className="text-xs font-normal text-gray-400">
                    · {logsForMeal(meal).reduce((sum, l) => sum + (l.calories_estimated || 0), 0)} kcal
                  </span>
                )}
              </h2>
              <button
                onClick={() => setOpenForm(meal)}
                className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold hover:bg-primary-700 transition-colors"
              >
                +
              </button>
            </div>

            {openForm === meal && (
              <Card className="mb-2">
                <FoodEntryForm
                  initialMealType={meal}
                  profileId={activeProfileId}
                  onSave={handleSave}
                  onCancel={() => setOpenForm(null)}
                />
              </Card>
            )}

            {logsForMeal(meal).length === 0 ? (
              <p className="text-sm text-gray-400 px-1">{t('food.no_entries')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {logsForMeal(meal).map(log => (
                  <Card key={log.id} className="flex items-start gap-3 py-3">
                    {log.image_url && (
                      <img
                        src={log.image_url}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm leading-tight">{log.description}</p>
                      {log.calories_estimated && (
                        <p className="text-xs text-primary-600 font-semibold mt-0.5">{log.calories_estimated} kcal</p>
                      )}
                      {log.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{log.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deleting === log.id}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                    >
                      {deleting === log.id ? '⏳' : '✕'}
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* WhatsApp alerts */}
      {profile?.phone_whatsapp && (
        <Card>
          <WhatsAppAlerts
            profile={profile}
            habitsText={null}
            foodText={foodSummary}
            summaryText={daySummary}
          />
        </Card>
      )}

      {!profile?.phone_whatsapp && (
        <div className="text-center py-2">
          <Link to={`/profiles/${activeProfileId}/edit`} className="text-sm text-primary-600 underline">
            {t('whatsapp.configure')}
          </Link>
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../context/ProfileContext'
import { useProfiles } from '../hooks/useProfiles'
import { useBloodPressure } from '../hooks/useBloodPressure'
import { useDoctorQuestions } from '../hooks/useDoctorQuestions'
import { useHabits } from '../hooks/useHabits'
import { useFoodLogs } from '../hooks/useFoodLogs'
import { calcBMR, calcTDEE } from '../lib/formulas'
import { classifyBP } from '../lib/bpStatus'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

export default function Dashboard() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading } = useProfiles()
  const { readings } = useBloodPressure(activeProfileId)
  const { questions } = useDoctorQuestions(activeProfileId)
  const { habits, todayLogs: habitLogs } = useHabits(activeProfileId)
  const { todayCalories } = useFoodLogs(activeProfileId)

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

  const lastBP = readings[0]
  const bpClass = lastBP ? classifyBP(lastBP.systolic, lastBP.diastolic) : null
  const bpStatusKey = bpClass ? `bp.status_${bpClass.status}` : null

  const pendingQuestions = questions.filter(q => !q.is_checked).length
  const completedHabits = habits.filter(h => habitLogs.some(l => l.habit_id === h.id)).length
  const habitProgress = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500">{t('dashboard.welcome')}, <span className="font-semibold text-gray-700">{profile.name}</span></p>
      </div>

      {/* Habits widget */}
      <Link to="/habits">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.habits_today')}</p>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {completedHabits}<span className="text-base font-normal text-gray-400"> / {habits.length}</span>
          </p>
          {habits.length > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${habitProgress}%` }}
              />
            </div>
          )}
        </Card>
      </Link>

      {/* Food calories widget */}
      <Link to="/food">
        <Card className="flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.calories_today')}</p>
            <p className="text-2xl font-bold text-primary-600">
              {todayCalories}
              <span className="text-base font-normal text-gray-400"> / {tdee} kcal</span>
            </p>
          </div>
          <span className="text-4xl">🍽️</span>
        </Card>
      </Link>

      {/* Calories Card */}
      <Link to="/calories">
        <Card className="flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.daily_calories')}</p>
            <p className="text-3xl font-bold text-primary-600">{tdee}</p>
            <p className="text-sm text-gray-400">{t('calories.kcal')}</p>
          </div>
          <span className="text-4xl">🔥</span>
        </Card>
      </Link>

      {/* Blood Pressure Card */}
      <Link to="/blood-pressure">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.last_bp')}</p>
            <span className="text-2xl">❤️</span>
          </div>
          {lastBP ? (
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-gray-900">{lastBP.systolic}/{lastBP.diastolic}</p>
              <p className="text-gray-400 text-sm">{t('bp.mmhg')}</p>
              {bpClass && (
                <Badge className={bpClass.badgeClass}>{t(bpStatusKey)}</Badge>
              )}
            </div>
          ) : (
            <p className="text-gray-400">{t('dashboard.no_bp')}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{readings.length} {t('dashboard.bp_readings')}</p>
        </Card>
      </Link>

      {/* Doctor Questions Card */}
      <Link to="/doctor-questions">
        <Card className="flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.doctor_questions')}</p>
            <p className="text-2xl font-bold text-gray-900">{pendingQuestions}</p>
            <p className="text-sm text-gray-400">{t('dashboard.questions_pending')}</p>
          </div>
          <span className="text-4xl">👨‍⚕️</span>
        </Card>
      </Link>

      {/* Profile info */}
      <Card className="bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {profile.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{profile.name}</p>
            <p className="text-sm text-gray-500">
              {profile.age} {t('profile.years')} · {profile.weight_kg} kg · {profile.height_cm} cm
            </p>
          </div>
          <Link to={`/profiles/${profile.id}/edit`} className="text-primary-600 text-sm font-medium">
            {t('common.edit')}
          </Link>
        </div>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrendingDown, Dumbbell, Scale, Heart, Footprints, Activity, Bike, Waves, Wind, Trophy, Home, Sprout, Zap, Flame, Target } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

const GOALS = [
  { id: 'lose_weight',    Icon: TrendingDown, color: 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-400', base: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' },
  { id: 'gain_muscle',   Icon: Dumbbell,     color: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-400', base: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' },
  { id: 'maintain',      Icon: Scale,        color: 'border-green-400 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400', base: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' },
  { id: 'improve_health',Icon: Heart,        color: 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 ring-2 ring-rose-400', base: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' },
]

const SPEEDS = ['slow', 'moderate', 'fast']
const ACTIVITIES = [
  { id: 'walking',      Icon: Footprints },
  { id: 'running',      Icon: Activity },
  { id: 'cycling',      Icon: Bike },
  { id: 'gym',          Icon: Dumbbell },
  { id: 'swimming',     Icon: Waves },
  { id: 'yoga',         Icon: Wind },
  { id: 'sports',       Icon: Trophy },
  { id: 'home_workout', Icon: Home },
]
const FREQUENCIES = ['1-2', '3-4', '5+']
const LEVELS = [
  { id: 'beginner',     Icon: Sprout },
  { id: 'intermediate', Icon: Zap },
  { id: 'advanced',     Icon: Flame },
]

export default function FitnessProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading, updateProfile } = useProfiles()

  const profile = profiles.find(p => p.id === activeProfileId)
  const fp = profile?.fitness_profile || {}

  const [goals, setGoals] = useState(['maintain'])
  const [targetWeight, setTargetWeight] = useState('')
  const [goalSpeed, setGoalSpeed] = useState('moderate')
  const [activities, setActivities] = useState([])
  const [frequency, setFrequency] = useState('3-4')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [waterGoal, setWaterGoal] = useState(2000)
  const [saving, setSaving] = useState(false)

  const toggleGoal = (id) => {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  useEffect(() => {
    if (profile) {
      setGoals(fp.goals ?? (profile.health_goal ? [profile.health_goal] : ['maintain']))
      setTargetWeight(profile.target_weight_kg || '')
      setGoalSpeed(profile.weight_goal_speed || 'moderate')
      setActivities(fp.preferred_activities || [])
      setFrequency(fp.workout_frequency || '3-4')
      setExperienceLevel(fp.experience_level || 'beginner')
      setWaterGoal(profile.water_goal_ml || 2000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId, profiles.length])

  const toggleActivity = (id) => {
    setActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleSave = async () => {
    if (goals.length === 0) return
    setSaving(true)
    try {
      await updateProfile(activeProfileId, {
        health_goal: goals[0],
        target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
        weight_goal_speed: goalSpeed,
        water_goal_ml: waterGoal ? parseInt(waterGoal) : 2000,
        fitness_profile: {
          ...fp,
          completed: true,
          completed_at: fp.completed_at || new Date().toISOString(),
          experience_level: experienceLevel,
          preferred_activities: activities,
          workout_frequency: frequency,
          goals,
        },
      })
      navigate(-1)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  const needsTarget = goals.includes('lose_weight') || goals.includes('gain_muscle')

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target size={24} strokeWidth={1.75} className="text-primary-500" />
          {t('fitness.profile_section_title')}
        </h1>
      </div>

      {/* Objetivo principal */}
      <Card>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('fitness.step_goal')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(g => {
            const isSelected = goals.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all active:scale-95 text-left ${
                  isSelected ? g.color : g.base
                }`}
              >
                <g.Icon size={18} strokeWidth={1.75} />
                <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {t(`fitness.goal_${g.id}`)}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Peso objetivo (condicional) */}
      {needsTarget && (
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t('fitness.step_target')}
          </p>
          {profile?.weight_kg && (
            <p className="text-xs text-gray-500 mb-2">
              {t('fitness.target_weight_hint', { weight: profile.weight_kg })}
            </p>
          )}
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="20"
            max="300"
            value={targetWeight}
            onChange={e => setTargetWeight(e.target.value)}
            placeholder="65"
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-center font-bold text-xl"
          />
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-4 mb-2">{t('fitness.goal_speed_title')}</p>
          <div className="flex gap-2">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => setGoalSpeed(s)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                  goalSpeed === s
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <p>{t(`fitness.speed_${s}`)}</p>
                <p className="font-normal text-[10px] mt-0.5 opacity-70">{t(`fitness.speed_${s}_desc`)}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Actividades */}
      <Card>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('fitness.step_activities')}
        </p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {ACTIVITIES.map(act => {
            const isSelected = activities.includes(act.id)
            return (
              <button
                key={act.id}
                onClick={() => toggleActivity(act.id)}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <act.Icon size={22} strokeWidth={1.75} className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'} />
                <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t(`fitness.activity_${act.id}`)}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('fitness.frequency_title')}</p>
        <div className="flex gap-2">
          {FREQUENCIES.map(freq => {
            const key = freq.replace('+', '_plus').replace('-', '_')
            return (
              <button
                key={freq}
                onClick={() => setFrequency(freq)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                  frequency === freq
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t(`fitness.freq_${key}`)}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Nivel de experiencia */}
      <Card>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('fitness.step_experience')}
        </p>
        <div className="flex gap-2">
          {LEVELS.map(lvl => (
            <button
              key={lvl.id}
              onClick={() => setExperienceLevel(lvl.id)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                experienceLevel === lvl.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <lvl.Icon size={22} strokeWidth={1.75} className={experienceLevel === lvl.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'} />
              <span className={`text-[10px] font-semibold text-center leading-tight ${experienceLevel === lvl.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}>
                {t(`fitness.level_${lvl.id}`)}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Meta de agua */}
      <Card>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('fitness.step_water')}
        </p>
        <input
          type="number"
          inputMode="numeric"
          step="100"
          min="500"
          max="5000"
          value={waterGoal}
          onChange={e => setWaterGoal(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-center font-bold text-xl"
        />
        <p className="text-xs text-gray-400 text-center mt-1">ml/día</p>
      </Card>

      {/* Botón guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
      >
        {saving ? <Spinner size="sm" /> : t('common.save')}
      </button>
    </div>
  )
}

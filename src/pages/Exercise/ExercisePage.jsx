import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, Dumbbell, Check, AlertTriangle, Plus, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useExerciseLogs } from '../../hooks/useExerciseLogs'
import { estimateCaloriesBurned, getWorkoutPlan } from '../../lib/exerciseUtils'

const EXERCISE_TYPES = ['cardio', 'strength', 'flexibility', 'sports', 'other']

const EMPTY_FORM = {
  exercise_type: 'cardio',
  name: '',
  duration_minutes: '',
  calories_burned: '',
  sets: '',
  reps: '',
  notes: '',
}

export default function ExercisePage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading } = useProfiles()
  const { todayLogs, todayCaloriesBurned, todayMinutes, addExerciseLog, deleteExerciseLog } = useExerciseLogs(activeProfileId)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showRoutine, setShowRoutine] = useState(true)

  const profile = profiles.find(p => p.id === activeProfileId)

  const experienceLevel = profile?.fitness_profile?.experience_level ?? 'beginner'
  const healthGoal = profile?.health_goal ?? 'improve_health'
  const isBeginner = experienceLevel === 'beginner' || !profile?.fitness_profile?.experience_level

  const workoutPlan = profile ? getWorkoutPlan(experienceLevel, healthGoal) : null

  const handleEstimate = () => {
    if (!form.name || !form.duration_minutes || !profile?.weight_kg) return
    const est = estimateCaloriesBurned(form.name, Number(form.duration_minutes), profile.weight_kg)
    setForm(prev => ({ ...prev, calories_burned: String(est) }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.exercise_type) return
    setSaving(true)
    try {
      await addExerciseLog({
        exercise_type: form.exercise_type,
        name: form.name.trim(),
        duration_minutes: Number(form.duration_minutes) || null,
        calories_burned: Number(form.calories_burned) || 0,
        sets: Number(form.sets) || null,
        reps: Number(form.reps) || null,
        notes: form.notes.trim() || null,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('exercise.delete_confirm', '¿Eliminar este registro?'))) return
    setDeletingId(id)
    try {
      await deleteExerciseLog(id)
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const program = t('exercise.program', { returnObjects: true })
  const benefits = t('exercise.benefits', { returnObjects: true })
  const safety = t('exercise.safety', { returnObjects: true })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        {t('common.loading', 'Cargando...')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('exercise.title')}</h1>
        <p className="text-gray-500 text-sm">
          {profile ? `${profile.name} · ${t(`exercise.plan.${
            experienceLevel === 'beginner' ? 'beginner_ih_title'
            : experienceLevel === 'intermediate' ? 'inter_ih_title'
            : 'adv_ih_title'
          }`, experienceLevel)}` : t('exercise.subtitle')}
        </p>
      </div>

      {/* Today's exercise log */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity size={18} strokeWidth={1.75} className="text-primary-500" />
            {t('exercise.log_title')}
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-sm text-primary-600 font-medium"
            >
              <Plus size={16} /> {t('exercise.add_exercise')}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('exercise.burned_today')}</p>
            <p className="font-bold text-2xl text-green-600">{todayCaloriesBurned}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('exercise.minutes_today')}</p>
            <p className="font-bold text-2xl text-blue-600">{todayMinutes}</p>
            <p className="text-xs text-gray-400">min</p>
          </div>
        </div>

        {/* Inline form */}
        {showForm && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 flex flex-col gap-3">
            {/* Type */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                {t('exercise.form_type')}
              </label>
              <select
                value={form.exercise_type}
                onChange={e => setForm(prev => ({ ...prev, exercise_type: e.target.value }))}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {EXERCISE_TYPES.map(type => (
                  <option key={type} value={type}>{t(`exercise.type_${type}`)}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                {t('exercise.form_name')} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('exercise.form_name')}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Duration + Estimate */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  {t('exercise.form_duration')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={e => setForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="30"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  {t('exercise.form_calories')}
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    value={form.calories_burned}
                    onChange={e => setForm(prev => ({ ...prev, calories_burned: e.target.value }))}
                    placeholder="0"
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-0"
                  />
                  <button
                    onClick={handleEstimate}
                    disabled={!form.name || !form.duration_minutes || !profile?.weight_kg}
                    title={t('exercise.btn_estimate')}
                    className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 disabled:opacity-40"
                  >
                    <Zap size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sets / Reps (optional) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  {t('exercise.form_sets')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.sets}
                  onChange={e => setForm(prev => ({ ...prev, sets: e.target.value }))}
                  placeholder="3"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  {t('exercise.form_reps')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.reps}
                  onChange={e => setForm(prev => ({ ...prev, reps: e.target.value }))}
                  placeholder="12"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                {t('exercise.form_notes')}
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('exercise.form_notes')}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? '...' : t('exercise.btn_save')}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400"
              >
                {t('exercise.btn_cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Today's logs list */}
        {todayLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">{t('exercise.no_logs')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {todayLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 py-2 border-b last:border-0 border-gray-100 dark:border-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{log.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge className="text-xs capitalize">
                      {t(`exercise.type_${log.exercise_type}`, log.exercise_type)}
                    </Badge>
                    {log.duration_minutes && (
                      <span className="text-xs text-gray-400">{log.duration_minutes} min</span>
                    )}
                    {log.sets && log.reps && (
                      <span className="text-xs text-gray-400">{log.sets}×{log.reps}</span>
                    )}
                    {log.calories_burned > 0 && (
                      <span className="text-xs text-green-600 font-medium">-{log.calories_burned} kcal</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Calorie impact */}
      {todayCaloriesBurned > 0 && (
        <Card className="border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <h2 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
            <Zap size={18} strokeWidth={1.75} className="text-green-600" />
            {t('exercise.calorie_impact')}
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400">
            {t('exercise.calorie_impact_text', { burned: todayCaloriesBurned })}
          </p>
        </Card>
      )}

      {/* Recommended routine */}
      {workoutPlan && (
        <Card>
          <button
            onClick={() => setShowRoutine(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Dumbbell size={18} strokeWidth={1.75} className="text-primary-500" />
              {t('exercise.recommended_routine')}
            </h2>
            {showRoutine ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {showRoutine && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {t(`exercise.plan.${workoutPlan.title_key.replace('exercise.plan.', '')}`, workoutPlan.title_key)}
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {t('exercise.routine_sessions', { n: workoutPlan.sessions })}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {t(`exercise.plan.${workoutPlan.focus_key.replace('exercise.plan.', '')}`, workoutPlan.focus_key)}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {workoutPlan.exercises.map((ex, i) => {
                  const exKey = ex.name_key.replace('exercise.plan.ex.', '')
                  const exName = t(`exercise.plan.ex.${exKey}`, exKey)
                  return (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 border-gray-100 dark:border-gray-800">
                      <span className="text-gray-900 dark:text-gray-100">{exName}</span>
                      <span className="text-gray-500 text-xs">
                        {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ''}
                        {ex.duration ? `${ex.duration} min` : ''}
                        {!ex.sets && !ex.duration ? '' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 8-week program (beginners) */}
      {isBeginner && (
        <Card>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Activity size={18} strokeWidth={1.75} className="text-primary-500" />
            {t('exercise.program_8w', 'Programa 8 semanas (principiantes)')}
          </h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 text-left">
                  <th className="pb-2 pr-3">{t('exercise.week')}</th>
                  <th className="pb-2 pr-3">{t('exercise.type')}</th>
                  <th className="pb-2 pr-3 text-center">{t('exercise.minutes')}</th>
                  <th className="pb-2 text-center">{t('exercise.days_per_week')}</th>
                </tr>
              </thead>
              <tbody>
                {program.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-semibold text-primary-600">{row.week_range}</td>
                    <td className="py-3 pr-3">
                      <p>{row.activity}</p>
                      <p className="text-xs text-gray-400">{row.notes}</p>
                    </td>
                    <td className="py-3 pr-3 text-center font-bold">{row.minutes}</td>
                    <td className="py-3 text-center">
                      <Badge className={row.intensity === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}>
                        {row.days}d
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Dumbbell size={18} strokeWidth={1.75} className="text-green-600" /> {t('exercise.benefits_title')}
        </h2>
        <ul className="flex flex-col gap-2">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
              <Check size={14} strokeWidth={2.5} className="mt-0.5 flex-shrink-0" /><span>{b}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Safety */}
      <Card className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <h2 className="font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
          <AlertTriangle size={18} strokeWidth={1.75} className="text-yellow-700 dark:text-yellow-400" /> {t('exercise.safety_title')}
        </h2>
        <ul className="flex flex-col gap-2">
          {safety.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
              <span className="mt-0.5 flex-shrink-0">•</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

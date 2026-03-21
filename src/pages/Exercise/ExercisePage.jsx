import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity, Dumbbell, Check, AlertTriangle, Plus, Trash2, Sparkles,
  ChevronDown, ChevronUp, Heart, Leaf, Trophy, Music, Zap, Timer,
  Flame, Info, X,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useExerciseLogs } from '../../hooks/useExerciseLogs'
import { useFoodLogs } from '../../hooks/useFoodLogs'
import { useEstimateExercise } from '../../hooks/useEstimateExercise'
import { EXERCISE_SUGGESTIONS, getWorkoutPlan, getRecoveryGuidance } from '../../lib/exerciseUtils'
import { calcExerciseEatBack } from '../../lib/formulas'

// ── Category config ──────────────────────────────────────
const CATEGORIES = [
  { key: 'cardio',      Icon: Heart,     label: 'exercise.category_cardio',      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',    ring: 'ring-red-400',    type: 'cardio' },
  { key: 'strength',   Icon: Dumbbell,  label: 'exercise.category_strength',    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   ring: 'ring-blue-400',   type: 'strength' },
  { key: 'flexibility',Icon: Leaf,      label: 'exercise.category_flexibility', color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20', ring: 'ring-green-400',  type: 'flexibility' },
  { key: 'sports',     Icon: Trophy,    label: 'exercise.category_sports',      color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', ring: 'ring-orange-400', type: 'sports' },
  { key: 'dance',      Icon: Music,     label: 'exercise.category_dance',       color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-900/20',   ring: 'ring-pink-400',   type: 'sports' },
  { key: 'other',      Icon: Sparkles,  label: 'exercise.category_other',       color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20',ring: 'ring-violet-400', type: 'other' },
]

const CATEGORY_COLORS = {
  cardio:      { bg: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',       border: 'border-red-100 dark:border-red-800',      icon: 'text-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  strength:    { bg: 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20',       border: 'border-blue-100 dark:border-blue-800',    icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  flexibility: { bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: 'border-green-100 dark:border-green-800', icon: 'text-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  sports:      { bg: 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',  border: 'border-orange-100 dark:border-orange-800', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  other:       { bg: 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20', border: 'border-violet-100 dark:border-violet-800', icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
}

const INTENSITY_COLORS = {
  low:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  moderate:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  very_high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

function getCategoryForType(type) {
  if (type === 'strength') return 'strength'
  if (type === 'flexibility') return 'flexibility'
  if (type === 'cardio') return 'cardio'
  return 'sports'
}

const EMPTY_FORM = {
  exercise_type: 'cardio',
  category: 'cardio',
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
  const { todayCalories } = useFoodLogs(activeProfileId)
  const { estimating, estimate, estimateExercise, clearEstimate } = useEstimateExercise()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showRoutine, setShowRoutine] = useState(false)
  const [showTips, setShowTips] = useState(false)

  // Autocomplete
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  const profile = profiles.find(p => p.id === activeProfileId)
  const experienceLevel = profile?.fitness_profile?.experience_level ?? 'beginner'
  const healthGoal = profile?.health_goal ?? 'improve_health'
  const isBeginner = experienceLevel === 'beginner' || !profile?.fitness_profile?.experience_level
  const workoutPlan = profile ? getWorkoutPlan(experienceLevel, healthGoal) : null

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNameChange(value) {
    setForm(prev => ({ ...prev, name: value }))
    clearEstimate()
    if (value.length >= 2) {
      const filtered = EXERCISE_SUGGESTIONS.filter(s =>
        s.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(suggestion) {
    setForm(prev => ({
      ...prev,
      name: suggestion.name,
      exercise_type: suggestion.type,
      category: suggestion.category,
    }))
    setShowSuggestions(false)
    clearEstimate()
  }

  function selectCategory(cat) {
    setForm(prev => ({
      ...prev,
      category: cat.key,
      exercise_type: cat.type,
      name: '',
    }))
    clearEstimate()
    const filtered = EXERCISE_SUGGESTIONS.filter(s => s.category === cat.key)
    setSuggestions(filtered.slice(0, 6))
    setShowSuggestions(filtered.length > 0)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleAIEstimate() {
    if (!form.name || !form.duration_minutes) return
    const result = await estimateExercise({
      exerciseName: form.name,
      durationMinutes: Number(form.duration_minutes),
      weightKg: profile?.weight_kg,
      experienceLevel,
      healthGoal,
    })
    if (result) {
      setForm(prev => ({ ...prev, calories_burned: String(result.calories_estimated) }))
    }
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
      clearEstimate()
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

  const selectedCat = CATEGORIES.find(c => c.key === form.category) ?? CATEGORIES[0]
  const calTarget = profile ? Math.round(
    (profile.weight_kg * 10 + profile.height_cm * 6.25 - profile.age * 5 + (profile.sex === 'male' ? 5 : -161)) *
    { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[profile.activity ?? 'sedentary']
  ) : 0
  const { extraCals: exerciseExtraCals } = calcExerciseEatBack(todayCaloriesBurned, healthGoal)
  const adjustedTarget = calTarget + exerciseExtraCals
  const canEatToday = Math.max(0, adjustedTarget - todayCalories)

  return (
    <div className="flex flex-col gap-4">

      {/* ── HEADER ── */}
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

      {/* ── STATS + LOG CARD ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity size={18} strokeWidth={1.75} className="text-primary-500" />
            {t('exercise.log_title')}
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-xl font-medium transition-colors"
            >
              <Plus size={15} /> {t('exercise.add_exercise')}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-3 text-center">
            <Flame size={16} className="text-green-500 mx-auto mb-1" />
            <p className="font-bold text-2xl text-green-600 tabular-nums">{todayCaloriesBurned}</p>
            <p className="text-xs text-gray-400">kcal</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{t('exercise.burned_today')}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-2xl p-3 text-center">
            <Timer size={16} className="text-blue-500 mx-auto mb-1" />
            <p className="font-bold text-2xl text-blue-600 tabular-nums">{todayMinutes}</p>
            <p className="text-xs text-gray-400">min</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{t('exercise.minutes_today')}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-3 text-center">
            <Zap size={16} className="text-orange-500 mx-auto mb-1" />
            <p className={`font-bold text-lg tabular-nums leading-tight mt-0.5 ${canEatToday === 0 ? 'text-red-500' : 'text-orange-600'}`}>
              {calTarget > 0 ? canEatToday.toLocaleString() : '—'}
            </p>
            <p className="text-xs text-gray-400">kcal</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Puedes comer hoy</p>
          </div>
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 flex flex-col gap-4">

            {/* Category picker */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                {t('exercise.form_type')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const active = form.category === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                        active
                          ? `${cat.bg} ${cat.ring} ring-2 border-transparent`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <cat.Icon size={20} strokeWidth={1.75} className={cat.color} />
                      <span className={`text-[10px] font-medium ${active ? cat.color : 'text-gray-500'}`}>
                        {t(cat.label)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Exercise name with autocomplete */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                {t('exercise.form_name')} *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                placeholder={t('exercise.search_exercise')}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                  {suggestions.map(s => {
                    const catCfg = CATEGORIES.find(c => c.key === s.category)
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                      >
                        {catCfg && <catCfg.Icon size={15} className={catCfg.color} />}
                        <span className="text-sm text-gray-900 dark:text-gray-100">{s.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{t(catCfg?.label ?? 'exercise.category_other')}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Duration + AI estimate */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  {t('exercise.form_duration')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={e => {
                    setForm(prev => ({ ...prev, duration_minutes: e.target.value }))
                    clearEstimate()
                  }}
                  placeholder="30"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  {t('exercise.form_calories')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={form.calories_burned}
                    onChange={e => setForm(prev => ({ ...prev, calories_burned: e.target.value }))}
                    placeholder="0"
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={handleAIEstimate}
                    disabled={estimating || !form.name || !form.duration_minutes}
                    title={t('exercise.ai_estimate')}
                    className="px-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
                  >
                    {estimating
                      ? <span className="animate-spin text-xs">⟳</span>
                      : <Sparkles size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* AI estimate result */}
            {estimate && !estimate.isFallback && (
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-500" />
                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                      {t('exercise.ai_estimate_result', { n: estimate.calories_estimated })}
                    </span>
                  </div>
                  {estimate.intensity && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${INTENSITY_COLORS[estimate.intensity] ?? ''}`}>
                      {t(`exercise.intensity_${estimate.intensity}`, estimate.intensity)}
                    </span>
                  )}
                </div>
                {estimate.description && (
                  <p className="text-xs text-violet-700 dark:text-violet-400 leading-relaxed">{estimate.description}</p>
                )}
                {estimate.tips && estimate.tips.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTips(v => !v)}
                    className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium"
                  >
                    <Info size={12} />
                    {t('exercise.ai_tips')}
                    {showTips ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
                {showTips && estimate.tips && (
                  <ul className="flex flex-col gap-1">
                    {estimate.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-violet-700 dark:text-violet-400 flex items-start gap-1.5">
                        <span className="mt-0.5 flex-shrink-0">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Sets / Reps */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  {t('exercise.form_sets')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.sets}
                  onChange={e => setForm(prev => ({ ...prev, sets: e.target.value }))}
                  placeholder="3"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  {t('exercise.form_reps')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.reps}
                  onChange={e => setForm(prev => ({ ...prev, reps: e.target.value }))}
                  placeholder="12"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                {t('exercise.form_notes')}
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('exercise.form_notes')}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? '...' : t('exercise.btn_save')}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); clearEstimate() }}
                className="p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── TODAY'S LOGS ── */}
        {todayLogs.length === 0 ? (
          <div className="text-center py-6">
            <Activity size={32} strokeWidth={1} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">{t('exercise.no_logs')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayLogs.map(log => {
              const catKey = getCategoryForType(log.exercise_type)
              const colors = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS.other
              const catCfg = CATEGORIES.find(c => c.type === log.exercise_type && c.key !== 'dance') ?? CATEGORIES[5]
              return (
                <div
                  key={log.id}
                  className={`${colors.bg} ${colors.border} border rounded-2xl p-3 flex items-center gap-3`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-black/20`}>
                    <catCfg.Icon size={20} strokeWidth={1.75} className={colors.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{log.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {log.duration_minutes && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <Timer size={10} /> {log.duration_minutes} min
                        </span>
                      )}
                      {log.sets && log.reps && (
                        <span className="text-xs text-gray-500">{log.sets}×{log.reps}</span>
                      )}
                      {log.calories_burned > 0 && (
                        <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                          <Flame size={10} /> {log.calories_burned} kcal
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deletingId === log.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40 flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── SMART RECOVERY CARD ── */}
      {todayCaloriesBurned > 0 && profile && (() => {
        const { extraCals, eatBackPct, rationale } = calcExerciseEatBack(todayCaloriesBurned, healthGoal)
        const remaining = Math.max(0, adjustedTarget - todayCalories)
        const recovery = getRecoveryGuidance(todayLogs, healthGoal)
        const subtitleKey = `exercise.recovery_subtitle_${recovery?.type ?? 'light'}`
        const reasonKey = `exercise.recovery_eat_back_reason_${rationale}`
        const timingKey = `exercise.recovery_timing_${recovery?.timing ?? 'within_2h'}`

        return (
          <Card className="border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Zap size={16} strokeWidth={2} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">{t('exercise.recovery_title')}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t(subtitleKey)}</p>
              </div>
            </div>

            {/* Eat-back recommendation */}
            <div className="mt-3 bg-white/60 dark:bg-black/20 rounded-xl p-3">
              <p className="font-bold text-emerald-800 dark:text-emerald-200 text-base">
                {t('exercise.recovery_eat_back', { n: extraCals, pct: eatBackPct })}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                {t(reasonKey)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Puedes comer hoy</span>
                <span className={`text-2xl font-bold tabular-nums ${remaining === 0 ? 'text-red-500' : 'text-emerald-700 dark:text-emerald-200'}`}>
                  {remaining.toLocaleString()} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-400">kcal</span>
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">
                Meta {adjustedTarget.toLocaleString()} kcal − Ya comiste {todayCalories.toLocaleString()} kcal
              </p>
            </div>

            {/* Macro focus */}
            {recovery?.macroFocus && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
                  {t('exercise.recovery_macros')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('exercise.recovery_protein'), value: recovery.macroFocus.protein_g, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                    { label: t('exercise.recovery_carbs'),   value: recovery.macroFocus.carbs_g,   color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
                    { label: t('exercise.recovery_fat'),     value: recovery.macroFocus.fat_g,     color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
                  ].map(m => (
                    <div key={m.label} className={`rounded-xl p-2 text-center ${m.color}`}>
                      <p className="text-[10px] font-medium opacity-80">{m.label}</p>
                      <p className="text-sm font-bold">{m.value}g</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food suggestions */}
            {recovery?.foods && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
                  {t('exercise.recovery_foods')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recovery.foods.map(food => (
                    <span key={food} className="text-xs bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hydration + timing */}
            <div className="mt-3 flex flex-col gap-1.5">
              {recovery?.hydration && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                  <span className="flex-shrink-0">💧</span>
                  {t('exercise.recovery_hydration')}
                </p>
              )}
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Timer size={12} />
                {t(timingKey)}
              </p>
            </div>
          </Card>
        )
      })()}

      {/* ── RECOMMENDED ROUTINE ── */}
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
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── 8-WEEK PROGRAM (beginners) ── */}
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

      {/* ── BENEFITS ── */}
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

      {/* ── SAFETY ── */}
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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dumbbell, CheckCircle, XCircle, Calendar, Clock, Sun, Sunset, Moon } from 'lucide-react'

const DAYS = [
  { id: 'lunes',     short: 'Lu' },
  { id: 'martes',    short: 'Ma' },
  { id: 'miercoles', short: 'Mi' },
  { id: 'jueves',    short: 'Ju' },
  { id: 'viernes',   short: 'Vi' },
  { id: 'sabado',    short: 'Sa' },
  { id: 'domingo',   short: 'Do' },
]

const DURATIONS = [
  { id: 20,  labelKey: 'fitness.duration_lt30' },
  { id: 40,  labelKey: 'fitness.duration_30_45' },
  { id: 52,  labelKey: 'fitness.duration_45_60' },
  { id: 75,  labelKey: 'fitness.duration_60plus' },
]

const TIMES = [
  { id: 'morning',   Icon: Sun,    labelKey: 'fitness.time_morning' },
  { id: 'afternoon', Icon: Sunset, labelKey: 'fitness.time_afternoon' },
  { id: 'evening',   Icon: Moon,   labelKey: 'fitness.time_evening' },
]

export default function RoutineStep({
  currentlyExercises,
  onCurrentlyExercisesChange,
  hasDefinedRoutine,
  onHasDefinedRoutineChange,
  routineDays,
  onRoutineDaysChange,
  sessionDurationMin,
  onSessionDurationChange,
  preferredWorkoutTime,
  onPreferredWorkoutTimeChange,
  onNext,
}) {
  const { t } = useTranslation()
  const [localState, setLocalState] = useState('q1') // q1 → q2 → q3 → done

  const handleExercisesYes = () => {
    onCurrentlyExercisesChange(true)
    setLocalState('q2')
  }

  const handleExercisesNo = () => {
    onCurrentlyExercisesChange(false)
    onHasDefinedRoutineChange(false)
    onRoutineDaysChange([])
    onSessionDurationChange(null)
    setLocalState('done_no')
  }

  const handleRoutineYes = () => {
    onHasDefinedRoutineChange(true)
    setLocalState('q3')
  }

  const handleRoutineNo = () => {
    onHasDefinedRoutineChange(false)
    setLocalState('q4')
  }

  const toggleDay = (dayId) => {
    if (routineDays.includes(dayId)) {
      onRoutineDaysChange(routineDays.filter(d => d !== dayId))
    } else {
      onRoutineDaysChange([...routineDays, dayId])
    }
  }

  const handleDurationNext = () => {
    setLocalState('q4')
  }

  const handleTimeSelect = (timeId) => {
    onPreferredWorkoutTimeChange(timeId)
  }

  const canContinueQ3 = routineDays.length > 0 && sessionDurationMin !== null

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
            <Dumbbell size={28} strokeWidth={1.75} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('fitness.step_routine')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fitness.routine_hint')}</p>
      </div>

      {/* Q1: ¿Haces ejercicio actualmente? */}
      {(localState === 'q1') && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
            {t('fitness.currently_exercises_q')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleExercisesYes}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-95"
            >
              <CheckCircle size={32} strokeWidth={1.75} className="text-primary-500" />
              <span className="font-bold text-gray-800 dark:text-gray-200">{t('common.yes')}</span>
            </button>
            <button
              onClick={handleExercisesNo}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              <XCircle size={32} strokeWidth={1.75} className="text-gray-400" />
              <span className="font-bold text-gray-800 dark:text-gray-200">{t('common.no')}</span>
            </button>
          </div>
        </div>
      )}

      {/* No exercise — encouragement */}
      {localState === 'done_no' && (
        <div className="flex flex-col gap-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-2xl px-5 py-4 text-center">
            <p className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
              {t('fitness.no_exercise_encouragement')}
            </p>
          </div>
          <button
            onClick={onNext}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-md"
          >
            {t('welcome.continue')}
          </button>
        </div>
      )}

      {/* Q2: ¿Tienes una rutina definida? */}
      {localState === 'q2' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
            {t('fitness.has_routine_q')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRoutineYes}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-95"
            >
              <Calendar size={28} strokeWidth={1.75} className="text-primary-500" />
              <span className="font-bold text-gray-800 dark:text-gray-200">{t('common.yes')}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('fitness.routine_yes_desc')}</span>
            </button>
            <button
              onClick={handleRoutineNo}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              <Clock size={28} strokeWidth={1.75} className="text-gray-400" />
              <span className="font-bold text-gray-800 dark:text-gray-200">{t('common.no')}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('fitness.routine_no_desc')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Q3: Días de rutina + duración */}
      {localState === 'q3' && (
        <div className="flex flex-col gap-4">
          {/* Días */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fitness.routine_days_q')}</p>
            <div className="flex gap-1.5">
              {DAYS.map(day => {
                const isSelected = routineDays.includes(day.id)
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duración */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fitness.session_duration_q')}</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map(dur => {
                const isSelected = sessionDurationMin === dur.id
                return (
                  <button
                    key={dur.id}
                    onClick={() => onSessionDurationChange(dur.id)}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(dur.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleDurationNext}
            disabled={!canContinueQ3}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-40 active:scale-95 transition-all shadow-md"
          >
            {t('welcome.continue')}
          </button>
        </div>
      )}

      {/* Q4: Horario preferido (para quienes sí ejercitan) */}
      {localState === 'q4' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
            {t('fitness.workout_time_q')}
          </p>
          <div className="flex flex-col gap-2">
            {TIMES.map(tm => {
              const isSelected = preferredWorkoutTime === tm.id
              return (
                <button
                  key={tm.id}
                  onClick={() => handleTimeSelect(tm.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all active:scale-95 text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <tm.Icon size={22} strokeWidth={1.75} className={isSelected ? 'text-primary-500' : 'text-gray-400'} />
                  <span className={`font-semibold text-sm ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t(tm.labelKey)}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            onClick={onNext}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-md mt-1"
          >
            {t('welcome.continue')}
          </button>
        </div>
      )}
    </div>
  )
}

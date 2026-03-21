import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../context/ProfileContext'
import { useProfiles } from '../hooks/useProfiles'
import { useBloodPressure } from '../hooks/useBloodPressure'
import { useDoctorQuestions } from '../hooks/useDoctorQuestions'
import { useHabits } from '../hooks/useHabits'
import { useFoodLogs } from '../hooks/useFoodLogs'
import { useWaterLogs } from '../hooks/useWaterLogs'
import { useFasting } from '../hooks/useFasting'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { useDashboardConfig, WIDGET_CATALOG } from '../hooks/useDashboardConfig'
import { calcBMR, calcTDEE, calcCalorieTarget, calcCalorieTargetMulti, calcMacros, getCalorieStatus, CALORIE_COLORS } from '../lib/formulas'
import { classifyBP } from '../lib/bpStatus'
import { NavIcon, WidgetIcon } from '../lib/navIcons'
import { Sunrise, Sun, Moon, Apple, Droplets, Zap, Heart, Scale, TrendingDown, TrendingUp, Stethoscope, Flame, X, Pencil, PartyPopper, ChevronUp, ChevronDown } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { ProgressRing } from '../components/ui/ProgressRing'
import { ElapsedTimer } from '../components/ui/CountdownTimer'
import { HealthCoach } from '../components/shared/HealthCoach'
import { getHabitDisplayName } from '../hooks/useHabits'
import FitnessProfileBanner from '../components/shared/FitnessProfileBanner'

// ─────────────────────────────────────────────────────────
//  WIDGET COMPONENTS
// ─────────────────────────────────────────────────────────

const GOAL_COLORS = {
  lose_weight:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  gain_muscle:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  improve_health: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  maintain:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

function CaloriesWidget({ todayCalories, calTarget, profile, activeGoals }) {
  const { t } = useTranslation()
  const pct = calTarget > 0 ? Math.min((todayCalories / calTarget) * 100, 100) : 0
  const status = getCalorieStatus(todayCalories, calTarget)
  const colors = CALORIE_COLORS[status]
  const left = calTarget - todayCalories

  const ringColor = status === 'over' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#16a34a'

  const isMulti = activeGoals && activeGoals.length > 1
  const goalLabel = isMulti
    ? t('dashboard.multi_goal', { n: activeGoals.length })
    : profile.health_goal === 'lose_weight'
    ? t('dashboard.goal_lose_weight')
    : profile.health_goal === 'gain_muscle'
    ? t('dashboard.goal_gain_muscle')
    : profile.health_goal === 'improve_health'
    ? t('dashboard.goal_improve_health')
    : t('dashboard.goal_maintain')

  const goalColor = isMulti
    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
    : GOAL_COLORS[profile.health_goal] ?? GOAL_COLORS.maintain

  const motivationKey = todayCalories === 0
    ? 'dashboard.motivation_empty'
    : status === 'over' ? 'dashboard.motivation_over'
    : status === 'warn' ? 'dashboard.motivation_warn'
    : 'dashboard.motivation_ok'

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('dashboard.calories_today')}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t(motivationKey)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${goalColor}`}>
          {goalLabel}
        </span>
      </div>

      {/* Ring + stats */}
      <div className="flex items-center gap-6">
        <ProgressRing percent={pct} size={96} strokeWidth={9} color={ringColor}>
          <div className="text-center">
            <p className={`text-xl font-bold leading-none ${colors.text}`}>{Math.round(pct)}%</p>
          </div>
        </ProgressRing>

        <div className="flex-1">
          <p className={`text-4xl font-bold tabular-nums ${colors.text}`}>{todayCalories}</p>
          <p className="text-sm text-gray-400">
            {t('dashboard.calories_of', { n: calTarget })}
          </p>
          <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {status === 'over'
              ? t('dashboard.calories_over', { n: Math.abs(left) })
              : t('dashboard.calories_remaining', { n: left })}
          </p>
        </div>
      </div>
    </Card>
  )
}

function QuickActionsWidget() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const actions = [
    { navKey: 'food',        labelKey: 'nav.food',        to: '/food',        color: 'from-primary-500 to-primary-600' },
    { navKey: 'water',       labelKey: 'nav.water',        to: '/water',       color: 'from-blue-400 to-blue-500' },
    { navKey: 'weight',      labelKey: 'nav.weight',       to: '/weight',      color: 'from-violet-500 to-violet-600' },
    { navKey: 'fasting',     labelKey: 'nav.fasting',      to: '/fasting',     color: 'from-amber-400 to-amber-500' },
    { navKey: 'food-search', labelKey: 'nav.food_search',  to: '/food-search', color: 'from-teal-400 to-teal-500' },
  ]
  return (
    <div className="flex gap-2">
      {actions.map(a => (
        <button
          key={a.to}
          onClick={() => navigate(a.to)}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-gradient-to-b ${a.color} text-white shadow-sm active:scale-95 transition-transform`}
        >
          <NavIcon navKey={a.navKey} size={20} />
          <span className="text-[10px] font-semibold">{t(a.labelKey)}</span>
        </button>
      ))}
    </div>
  )
}

function MealsWidget({ todayLogs, calTarget }) {
  const { t } = useTranslation()
  const MEAL_ICONS = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Apple }
  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

  const mealCal = (type) => todayLogs.filter(l => l.meal_type === type).reduce((s, l) => s + (l.calories_estimated || 0), 0)
  const hasLogs = (type) => todayLogs.some(l => l.meal_type === type)

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {MEAL_TYPES.map(meal => {
        const has = hasLogs(meal)
        const kcal = mealCal(meal)
        const pct = calTarget > 0 ? Math.min((kcal / (calTarget / 4)) * 100, 100) : 0
        return (
          <Link key={meal} to="/food">
            <div className={`rounded-2xl p-3.5 transition-all active:scale-95 ${
              has
                ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {(() => { const MIcon = MEAL_ICONS[meal]; return <MIcon size={16} strokeWidth={1.75} className="text-gray-500 dark:text-gray-400 flex-shrink-0" /> })()}
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t(`food.${meal}`)}</span>
                </div>
                {has && <span className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />}
              </div>
              {has ? (
                <>
                  <p className="text-base font-bold text-primary-600 dark:text-primary-400">{kcal}<span className="text-xs font-normal ml-0.5">kcal</span></p>
                  <div className="mt-1.5 h-1 w-full bg-primary-100 dark:bg-primary-900/40 rounded-full">
                    <div className="h-1 bg-primary-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 mt-1">{t('dashboard.meal_missing')}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function MacrosWidget({ todayLogs, calTarget }) {
  const { t } = useTranslation()
  const macroGoals = calTarget ? calcMacros(calTarget) : null
  const hasMacros = todayLogs.some(l => l.protein_g || l.carbs_g || l.fat_g)
  if (!hasMacros || !macroGoals) return null

  const totals = todayLogs.reduce(
    (acc, l) => ({ p: acc.p + (l.protein_g || 0), c: acc.c + (l.carbs_g || 0), f: acc.f + (l.fat_g || 0) }),
    { p: 0, c: 0, f: 0 }
  )

  const bars = [
    { labelKey: 'food.protein', value: Math.round(totals.p), max: macroGoals.protein_g, color: '#3b82f6', bg: 'bg-blue-500', track: 'bg-blue-100 dark:bg-blue-900/30' },
    { labelKey: 'food.carbs', value: Math.round(totals.c), max: macroGoals.carbs_g, color: '#22c55e', bg: 'bg-green-500', track: 'bg-green-100 dark:bg-green-900/30' },
    { labelKey: 'food.fat', value: Math.round(totals.f), max: macroGoals.fat_g, color: '#f59e0b', bg: 'bg-amber-400', track: 'bg-amber-100 dark:bg-amber-900/30' },
  ]

  return (
    <Card>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('food.macros')}</p>
      <div className="flex gap-4 mb-4">
        {bars.map(b => {
          const pct = b.max > 0 ? Math.min((b.value / b.max) * 100, 100) : 0
          return (
            <div key={b.labelKey} className="flex-1 flex flex-col items-center gap-1">
              <ProgressRing percent={pct} size={52} strokeWidth={5} color={b.color}>
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">{Math.round(pct)}%</span>
              </ProgressRing>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{b.value}g</p>
              <p className="text-[10px] text-gray-400 text-center leading-tight">{t(b.labelKey)}</p>
            </div>
          )
        })}
      </div>
      <div className="flex flex-col gap-2">
        {bars.map(b => {
          const pct = b.max > 0 ? Math.min((b.value / b.max) * 100, 100) : 0
          const over = b.value > b.max
          return (
            <div key={b.labelKey} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 flex-shrink-0">{t(b.labelKey)}</span>
              <div className={`flex-1 h-2 rounded-full ${b.track}`}>
                <div className={`h-2 rounded-full transition-all duration-700 ${over ? 'bg-red-400' : b.bg}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs font-semibold tabular-nums w-14 text-right ${over ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                {b.value}/{b.max}g
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WaterDashWidget({ profileId, waterGoalMl }) {
  const { t } = useTranslation()
  const { todayTotal, todayPercent, addWater } = useWaterLogs(profileId, waterGoalMl)
  const ringColor = todayPercent >= 100 ? '#22c55e' : '#3b82f6'

  const handleAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try { await addWater(250) } catch {}
  }

  return (
    <Link to="/water">
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <ProgressRing percent={todayPercent} size={48} strokeWidth={5} color={ringColor}>
            <Droplets size={16} strokeWidth={1.75} style={{ color: ringColor }} />
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">{t('nav.water')}</p>
            <p className="text-base font-bold text-blue-600 tabular-nums">{todayTotal}<span className="text-xs font-normal text-gray-400 ml-0.5">/{waterGoalMl}ml</span></p>
          </div>
          <button
            onClick={handleAdd}
            className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold hover:bg-blue-600 active:scale-90 transition-all flex-shrink-0"
          >
            +
          </button>
        </div>
      </Card>
    </Link>
  )
}

function FastingDashWidget({ profileId }) {
  const { t } = useTranslation()
  const { activeSession, startFast } = useFasting(profileId)

  const handleStart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try { await startFast(16) } catch {}
  }

  if (!activeSession) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0"><Zap size={22} strokeWidth={1.75} className="text-violet-600 dark:text-violet-400" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">{t('nav.fasting')}</p>
            <p className="text-xs text-gray-500">{t('fasting.no_active')}</p>
          </div>
          <button
            onClick={handleStart}
            className="px-2.5 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 active:scale-95 transition-all flex-shrink-0"
          >
            16h
          </button>
        </div>
      </Card>
    )
  }

  const elapsed = Date.now() - new Date(activeSession.start_time).getTime()
  const pct = Math.min((elapsed / (activeSession.target_hours * 3600000)) * 100, 100)

  return (
    <Link to="/fasting">
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <ProgressRing percent={pct} size={48} strokeWidth={5} color="#7c3aed">
            <Zap size={16} strokeWidth={1.75} style={{ color: '#7c3aed' }} />
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">{t('fasting.active')}</p>
            <ElapsedTimer startTime={activeSession.start_time} className="text-sm font-bold text-violet-600" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

function HabitsWidget({ habits, habitLogs }) {
  const { t } = useTranslation()
  const done = habits.filter(h => habitLogs.some(l => l.habit_id === h.id)).length
  const pct = habits.length > 0 ? (done / habits.length) * 100 : 0
  const allDone = habits.length > 0 && done === habits.length

  return (
    <Link to="/habits">
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('dashboard.habits_today')}</p>
          <div className="flex items-center gap-1.5">
            {allDone && <PartyPopper size={16} strokeWidth={1.75} className="text-green-500" />}
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{done}</span>
            <span className="text-sm text-gray-400">/ {habits.length}</span>
          </div>
        </div>

        {habits.length > 0 && (
          <>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${allDone ? 'bg-green-500' : pct > 0 ? 'bg-amber-400' : 'bg-gray-300'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {habits.slice(0, 6).map(h => {
                const isDone = habitLogs.some(l => l.habit_id === h.id)
                return (
                  <span
                    key={h.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                      isDone
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}
                  >
                    {getHabitDisplayName(h.name, t)}
                  </span>
                )
              })}
            </div>
          </>
        )}
      </Card>
    </Link>
  )
}

function BPWidget({ readings }) {
  const { t } = useTranslation()
  const last = readings[0]
  const bpClass = last ? classifyBP(last.systolic, last.diastolic) : null

  return (
    <Link to="/blood-pressure">
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium">{t('nav.blood_pressure')}</p>
          <Heart size={16} strokeWidth={1.75} className="text-rose-500" />
        </div>
        {last ? (
          <>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{last.systolic}<span className="text-gray-400">/{last.diastolic}</span></p>
            <p className="text-[10px] text-gray-400 mb-1.5">mmHg</p>
            {bpClass && <Badge className={`${bpClass.badgeClass} text-[10px]`}>{t(`bp.status_${bpClass.status}`)}</Badge>}
          </>
        ) : (
          <p className="text-sm text-gray-400">{t('dashboard.no_bp')}</p>
        )}
      </Card>
    </Link>
  )
}

function WeightDashWidget({ profileId, targetWeight }) {
  const { t } = useTranslation()
  const { latestWeight, logs } = useWeightLogs(profileId)
  const diff = latestWeight && targetWeight ? Math.round((latestWeight - targetWeight) * 10) / 10 : null
  const trend = logs.length >= 2 ? Math.round((logs[0].weight_kg - logs[1].weight_kg) * 10) / 10 : null

  return (
    <Link to="/weight">
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium">{t('nav.weight')}</p>
          <Scale size={16} strokeWidth={1.75} className="text-violet-500" />
        </div>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {latestWeight ?? '—'}<span className="text-xs font-normal text-gray-400 ml-0.5">kg</span>
        </p>
        {diff !== null && (
          <p className={`text-xs font-semibold mt-0.5 ${diff === 0 ? 'text-green-500' : diff > 0 ? 'text-amber-500' : 'text-blue-500'}`}>
            {t('dashboard.kg_vs_goal', { diff: diff > 0 ? `+${diff}` : diff })}
          </p>
        )}
        {trend !== null && (() => {
          const TrendIcon = trend < 0 ? TrendingDown : TrendingUp
          return (
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-0.5">
              <TrendIcon size={10} strokeWidth={2} /> {t('dashboard.kg_vs_yesterday', { diff: Math.abs(trend) })}
            </p>
          )
        })()}
      </Card>
    </Link>
  )
}

function DoctorWidget({ questions }) {
  const { t } = useTranslation()
  const pending = questions.filter(q => !q.is_checked).length
  const total = questions.length

  return (
    <Link to="/doctor-questions">
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium">{t('dashboard.doctor_short')}</p>
          <Stethoscope size={16} strokeWidth={1.75} className="text-teal-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pending}</p>
        <p className="text-[10px] text-gray-400">{t('dashboard.questions_pending')}</p>
        {total > 0 && (
          <div className="mt-1.5 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className="h-1 bg-green-400 rounded-full"
              style={{ width: `${((total - pending) / total) * 100}%` }}
            />
          </div>
        )}
      </Card>
    </Link>
  )
}

function StreakWidget({ habits, habitLogs }) {
  const { t } = useTranslation()
  const done = habits.filter(h => habitLogs.some(l => l.habit_id === h.id)).length
  const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 font-medium">{t('dashboard.completed_today')}</p>
        <Flame size={16} strokeWidth={1.75} className="text-orange-500" />
      </div>
      <p className="text-2xl font-bold text-orange-500">{pct}%</p>
      <p className="text-[10px] text-gray-400">{done} {t('dashboard.habits_of', { n: habits.length })}</p>
    </Card>
  )
}

function CoachWidget({ profileId, profile, calTarget, todayCalories, todayLogs, habits, habitLogs, lastBP }) {
  return (
    <HealthCoach
      profileId={profileId}
      profile={profile}
      calTarget={calTarget}
      todayCalories={todayCalories}
      foodLogs={todayLogs}
      habits={habits}
      habitLogs={habitLogs}
      lastBP={lastBP}
    />
  )
}

// ─────────────────────────────────────────────────────────
//  EDIT MODE — Widget Card wrapper
// ─────────────────────────────────────────────────────────

function EditableWidget({ id, children, onHide, onMoveUp, onMoveDown, isFirst, isLast, onPointerDown, isDragging, isOver }) {
  const { t } = useTranslation()
  const meta = WIDGET_CATALOG.find(w => w.id === id)

  return (
    <div
      data-widget-id={id}
      className={`relative rounded-2xl transition-all duration-200 select-none ${
        isDragging
          ? 'opacity-0 pointer-events-none'
          : isOver
          ? 'scale-[1.015] ring-[2.5px] ring-primary-500 ring-offset-2 dark:ring-offset-gray-950 shadow-lg shadow-primary-500/20'
          : ''
      }`}
    >
      {/* iOS-style floating controls — don't obscure content */}
      {/* Remove button — top-right corner */}
      <button
        onClick={() => onHide(id)}
        className="absolute -top-2.5 -right-2.5 z-30 w-6 h-6 rounded-full bg-gray-600 dark:bg-gray-500 text-white flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
        style={{ fontSize: 13, lineHeight: 1 }}
      ><X size={12} strokeWidth={2.5} /></button>

      {/* Drag handle — top-left corner pill */}
      <div
        onPointerDown={(e) => onPointerDown(e, id)}
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 dark:bg-gray-600 rounded-full shadow-md cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="white" opacity="0.8">
          <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
          <rect x="0" y="3.25" width="12" height="1.5" rx="0.75"/>
          <rect x="0" y="6.5" width="12" height="1.5" rx="0.75"/>
        </svg>
        <span className="text-white text-[10px] font-semibold opacity-80 leading-none">{meta ? t(meta.label) : ''}</span>
      </div>

      {/* Up/Down reorder — bottom bar, subtle */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 bg-gray-700 dark:bg-gray-600 rounded-full px-1 py-0.5 shadow-md">
        <button
          onClick={() => onMoveUp(id)}
          disabled={isFirst}
          className="w-6 h-5 flex items-center justify-center text-white disabled:opacity-25 hover:text-primary-300 transition-colors rounded-full"
        ><ChevronUp size={12} strokeWidth={2} /></button>
        <div className="w-px h-3 bg-gray-500"/>
        <button
          onClick={() => onMoveDown(id)}
          disabled={isLast}
          className="w-6 h-5 flex items-center justify-center text-white disabled:opacity-25 hover:text-primary-300 transition-colors rounded-full"
        ><ChevronDown size={12} strokeWidth={2} /></button>
      </div>

      {/* Widget content with padding for floating controls */}
      <div className={`rounded-2xl overflow-hidden ${isOver ? '' : ''}`}>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  DASHBOARD PAGE
// ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles, loading } = useProfiles()
  const { readings } = useBloodPressure(activeProfileId)
  const { questions } = useDoctorQuestions(activeProfileId)
  const { habits, todayLogs: habitLogs } = useHabits(activeProfileId)
  const { todayCalories, todayLogs } = useFoodLogs(activeProfileId)
  const {
    visibleWidgets, hiddenWidgets,
    moveWidget, hideWidget, showWidget, reorderWidgets, resetAll,
  } = useDashboardConfig()

  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const dragRef = useRef({ fromId: null, overId: null, offsetX: 0, offsetY: 0, ghostW: 0, ghostH: 0 })

  const [fitnessBannerDismissed, setFitnessBannerDismissed] = useState(() => {
    if (!activeProfileId) return true
    const ts = localStorage.getItem(`fitness_banner_dismissed_${activeProfileId}`)
    if (!ts) return false
    return Date.now() - parseInt(ts) < 7 * 24 * 60 * 60 * 1000
  })
  const [dragFromId, setDragFromId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [dragPointer, setDragPointer] = useState(null) // { x, y } — follows pointer for ghost

  const profile = profiles.find(p => p.id === activeProfileId)

  // ── Computed values ─────────────────────────────────────
  const bmr = profile ? calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex) : 0
  const tdee = profile ? calcTDEE(bmr, profile.activity) : 0
  const activeGoals = profile?.fitness_profile?.goals
  const calTarget = profile
    ? (activeGoals?.length > 0
        ? calcCalorieTargetMulti(tdee, activeGoals)
        : calcCalorieTarget(tdee, profile.health_goal))
    : 0
  const lastBP = readings[0]

  // ── Pointer-based drag (mouse + touch) ──────────────────
  const handlePointerDown = useCallback((e, id) => {
    e.preventDefault()
    const el = document.querySelector(`[data-widget-id="${id}"]`)
    const rect = el?.getBoundingClientRect() ?? { left: 0, top: 0, width: 300, height: 120 }
    dragRef.current = {
      fromId: id,
      overId: id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      ghostW: rect.width,
      ghostH: rect.height,
    }
    setDragFromId(id)
    setDragOverId(id)
    setDragPointer({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    if (!dragFromId) return

    // Prevent page scroll on touch while dragging
    const preventScroll = (e) => e.preventDefault()
    document.addEventListener('touchmove', preventScroll, { passive: false })

    const onMove = (e) => {
      setDragPointer({ x: e.clientX, y: e.clientY })
      // Walk up from element under pointer to find data-widget-id
      let el = document.elementFromPoint(e.clientX, e.clientY)
      while (el && !el.dataset.widgetId) el = el.parentElement
      if (el?.dataset.widgetId && el.dataset.widgetId !== dragRef.current.fromId) {
        const overId = el.dataset.widgetId
        if (dragRef.current.overId !== overId) {
          dragRef.current.overId = overId
          setDragOverId(overId)
        }
      }
    }

    const onUp = () => {
      const { fromId, overId } = dragRef.current
      if (fromId && overId && fromId !== overId) reorderWidgets(fromId, overId)
      dragRef.current = { fromId: null, overId: null, offsetX: 0, offsetY: 0, ghostW: 0, ghostH: 0 }
      setDragFromId(null)
      setDragOverId(null)
      setDragPointer(null)
      document.removeEventListener('touchmove', preventScroll)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      document.removeEventListener('touchmove', preventScroll)
    }
  }, [dragFromId, reorderWidgets])

  // ── Widget renderer ─────────────────────────────────────
  const renderWidget = (id) => {
    if (!profile) return null
    const waterGoal = profile.water_goal_ml || 2000

    switch (id) {
      case 'calories':
        return <CaloriesWidget todayCalories={todayCalories} calTarget={calTarget} profile={profile} activeGoals={activeGoals} />
      case 'quick_actions':
        return <QuickActionsWidget />
      case 'meals':
        return <MealsWidget todayLogs={todayLogs} calTarget={calTarget} />
      case 'macros':
        return <MacrosWidget todayLogs={todayLogs} calTarget={calTarget} />
      case 'water':
        return <WaterDashWidget profileId={activeProfileId} waterGoalMl={waterGoal} />
      case 'fasting':
        return <FastingDashWidget profileId={activeProfileId} />
      case 'habits':
        return <HabitsWidget habits={habits} habitLogs={habitLogs} />
      case 'coach':
        return <CoachWidget profileId={activeProfileId} profile={profile} calTarget={calTarget}
          todayCalories={todayCalories} todayLogs={todayLogs} habits={habits} habitLogs={habitLogs} lastBP={lastBP} />
      case 'bp':
        return <BPWidget readings={readings} />
      case 'weight':
        return <WeightDashWidget profileId={activeProfileId} targetWeight={profile.target_weight_kg} />
      case 'doctor':
        return <DoctorWidget questions={questions} />
      case 'streak':
        return <StreakWidget habits={habits} habitLogs={habitLogs} />
      default:
        return null
    }
  }

  // ── Group half-width widgets into pairs ─────────────────
  const groupWidgets = (ids) => {
    const result = []
    let i = 0
    while (i < ids.length) {
      const meta = WIDGET_CATALOG.find(w => w.id === ids[i])
      if (meta?.size === 'half') {
        // Look for next half-width widget
        const nextMeta = i + 1 < ids.length ? WIDGET_CATALOG.find(w => w.id === ids[i + 1]) : null
        if (nextMeta?.size === 'half') {
          result.push({ type: 'pair', ids: [ids[i], ids[i + 1]] })
          i += 2
        } else {
          result.push({ type: 'single', id: ids[i] })
          i++
        }
      } else {
        result.push({ type: 'single', id: ids[i] })
        i++
      }
    }
    return result
  }

  // ── Loading / empty states ──────────────────────────────
  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Heart size={48} strokeWidth={1.5} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('app_title')}</h1>
        <p className="text-gray-500 max-w-xs text-sm">{t('dashboard.select_profile')}</p>
      </div>
    )
  }

  const groups = groupWidgets(visibleWidgets)
  const showFitnessBanner = profile && !profile.fitness_profile?.completed && !fitnessBannerDismissed

  return (
    <div className={`flex flex-col transition-all duration-300 ${editMode ? 'gap-8' : 'gap-4'}`}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link to={`/profiles/${profile.id}/edit`}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20 hover:scale-105 active:scale-95 transition-transform">
            {profile.name[0].toUpperCase()}
          </div>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-gray-400">{t('dashboard.welcome')}</p>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{profile.name}</h1>
        </div>
        <button
          onClick={() => setEditMode(e => !e)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            editMode
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {editMode ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10 2L5 9l-3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t('dashboard.btn_done')}
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 1.5l2 2L3 11H1V9l7.5-7.5z"/>
              </svg>
              {t('common.edit')}
            </>
          )}
        </button>
      </div>

      {/* ── FITNESS BANNER ─────────────────────────────────── */}
      {showFitnessBanner && (
        <FitnessProfileBanner
          onStart={() => navigate('/onboarding/fitness')}
          onDismiss={() => {
            localStorage.setItem(`fitness_banner_dismissed_${activeProfileId}`, Date.now().toString())
            setFitnessBannerDismissed(true)
          }}
        />
      )}

      {/* ── EDIT MODE BANNER ───────────────────────────────── */}
      {editMode && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
          <Pencil size={18} strokeWidth={1.75} className="text-primary-600 dark:text-primary-400" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">{t('dashboard.edit_mode_title')}</p>
            <p className="text-[11px] text-primary-600/70 dark:text-primary-400/70">{t('dashboard.edit_mode_hint')}</p>
          </div>
          <button
            onClick={resetAll}
            className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 px-2.5 py-1 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
          >
            {t('dashboard.btn_reset')}
          </button>
        </div>
      )}

      {/* ── VISIBLE WIDGETS ────────────────────────────────── */}
      {groups.map((group, gi) => {
        if (group.type === 'pair') {
          return (
            <div key={group.ids.join('-')} className="grid grid-cols-2 gap-3">
              {group.ids.map((id, ii) => {
                const absIndex = visibleWidgets.indexOf(id)
                const content = renderWidget(id)
                if (!content) return null
                return editMode ? (
                  <EditableWidget
                    key={id} id={id}
                    onHide={hideWidget}
                    onMoveUp={moveWidget} onMoveDown={moveWidget}
                    isFirst={absIndex === 0} isLast={absIndex === visibleWidgets.length - 1}
                    onPointerDown={handlePointerDown}
                    isDragging={dragFromId === id}
                    isOver={dragOverId === id && dragFromId !== id}
                  >
                    {content}
                  </EditableWidget>
                ) : (
                  <div key={id} data-widget-id={id}>{content}</div>
                )
              })}
            </div>
          )
        }

        const { id } = group
        const absIndex = visibleWidgets.indexOf(id)
        const content = renderWidget(id)
        if (!content) return null

        return editMode ? (
          <EditableWidget
            key={id} id={id}
            onHide={hideWidget}
            onMoveUp={(wid) => moveWidget(wid, 'up')}
            onMoveDown={(wid) => moveWidget(wid, 'down')}
            isFirst={absIndex === 0} isLast={absIndex === visibleWidgets.length - 1}
            onPointerDown={handlePointerDown}
            isDragging={dragFromId === id}
            isOver={dragOverId === id && dragFromId !== id}
          >
            {content}
          </EditableWidget>
        ) : (
          <div key={id} data-widget-id={id}>{content}</div>
        )
      })}

      {/* ── ADD HIDDEN WIDGETS (edit mode) ─────────────────── */}
      {editMode && hiddenWidgets.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">{t('dashboard.add_widgets')}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {hiddenWidgets.map(id => {
              const meta = WIDGET_CATALOG.find(w => w.id === id)
              if (!meta) return null
              return (
                <button
                  key={id}
                  onClick={() => showWidget(id)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-left hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:border-primary-700 transition-all group"
                >
                  <WidgetIcon id={id} size={22} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">{t(meta.label)}</p>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-primary-500 text-gray-500 group-hover:text-white flex items-center justify-center text-sm font-bold transition-all">+</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DRAG GHOST — floats under finger/cursor ─────────── */}
      {dragFromId && dragPointer && createPortal(
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: dragPointer.x - dragRef.current.offsetX,
            top: dragPointer.y - dragRef.current.offsetY,
            width: dragRef.current.ghostW,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'scale(1.05) rotate(-1.5deg)',
            transformOrigin: 'center top',
            opacity: 0.92,
            filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.35))',
            borderRadius: 16,
            overflow: 'hidden',
            willChange: 'transform',
          }}
        >
          {renderWidget(dragFromId)}
        </div>,
        document.body
      )}

    </div>
  )
}

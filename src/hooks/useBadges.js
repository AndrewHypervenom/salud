import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const BADGE_CATEGORIES = [
  'nutricion', 'agua', 'peso', 'presion', 'ayuno', 'habitos', 'constancia', 'explorador', 'elite'
]

export const ALL_BADGES = [
  // --- nutricion ---
  { key: 'first_log',        emoji: '🍽️', category: 'nutricion', difficulty: 'easy',   label_es: 'Primera comida',       label_en: 'First meal',            desc_es: 'Registra tu primera comida',                              desc_en: 'Log your first meal' },
  { key: 'meal_variety_day', emoji: '🌈', category: 'nutricion', difficulty: 'easy',   label_es: 'Día completo',          label_en: 'Complete day',           desc_es: 'Registra desayuno, almuerzo y cena en un día',             desc_en: 'Log breakfast, lunch and dinner in one day' },
  { key: 'food_tracker_7',   emoji: '📆', category: 'nutricion', difficulty: 'easy',   label_es: '7 días de comidas',     label_en: '7 days of meals',        desc_es: 'Registra comidas en 7 días distintos',                     desc_en: 'Log meals on 7 different days', progress_total: 7 },
  { key: 'night_snack',      emoji: '🌙', category: 'nutricion', difficulty: 'easy',   label_es: 'Cena tardía',           label_en: 'Late dinner',            desc_es: 'Registra una cena después de las 9pm',                    desc_en: 'Log a dinner after 9pm' },
  { key: 'early_bird',       emoji: '🐓', category: 'nutricion', difficulty: 'easy',   label_es: 'Madrugador',            label_en: 'Early bird',             desc_es: 'Registra un desayuno antes de las 8am',                   desc_en: 'Log a breakfast before 8am' },
  { key: 'calorie_goal_3',   emoji: '🎯', category: 'nutricion', difficulty: 'easy',   label_es: 'En la meta x3',         label_en: 'On target x3',           desc_es: 'Cumple tu meta calórica 3 días distintos',                 desc_en: 'Hit your calorie goal on 3 different days', progress_total: 3 },
  { key: 'food_tracker_30',  emoji: '📅', category: 'nutricion', difficulty: 'medium', label_es: '30 días de comidas',    label_en: '30 days of meals',       desc_es: 'Registra comidas en 30 días distintos',                    desc_en: 'Log meals on 30 different days', progress_total: 30 },
  { key: 'calorie_goal_21',  emoji: '🏹', category: 'nutricion', difficulty: 'medium', label_es: 'Francotirador',         label_en: 'Sharpshooter',           desc_es: 'Cumple tu meta calórica 21 días distintos',                desc_en: 'Hit your calorie goal on 21 different days', progress_total: 21 },
  { key: 'macro_master',     emoji: '⚗️', category: 'nutricion', difficulty: 'hard',   label_es: 'Maestro de macros',     label_en: 'Macro master',           desc_es: 'Registra proteína, carbos y grasa en 15 días distintos',   desc_en: 'Log protein, carbs and fat on 15 different days', progress_total: 15 },
  { key: 'food_tracker_100', emoji: '🗓️', category: 'nutricion', difficulty: 'hard',   label_es: '100 días de comidas',   label_en: '100 days of meals',      desc_es: 'Registra comidas en 100 días distintos',                   desc_en: 'Log meals on 100 different days', progress_total: 100 },

  // --- agua ---
  { key: 'first_water',      emoji: '💧', category: 'agua', difficulty: 'easy',   label_es: 'Primera gota',        label_en: 'First drop',         desc_es: 'Registra agua por primera vez',                   desc_en: 'Log water for the first time' },
  { key: 'hydrated_1',       emoji: '🥤', category: 'agua', difficulty: 'easy',   label_es: 'Meta de agua',        label_en: 'Water goal',         desc_es: 'Alcanza tu meta de agua en un día',               desc_en: 'Reach your water goal in one day' },
  { key: 'hydrated_7',       emoji: '🌊', category: 'agua', difficulty: 'medium', label_es: '7 días hidratado',    label_en: '7 days hydrated',    desc_es: 'Alcanza tu meta de agua 7 días distintos',         desc_en: 'Reach your water goal on 7 different days', progress_total: 7 },
  { key: 'water_streak_5',   emoji: '🌧️', category: 'agua', difficulty: 'medium', label_es: 'Racha acuática',      label_en: 'Water streak',       desc_es: 'Alcanza la meta de agua 5 días seguidos',          desc_en: 'Reach your water goal 5 days in a row', progress_total: 5 },
  { key: 'hydrated_30',      emoji: '🏊', category: 'agua', difficulty: 'hard',   label_es: 'Mes hidratado',       label_en: 'Hydrated month',     desc_es: 'Alcanza tu meta de agua 30 días distintos',        desc_en: 'Reach your water goal on 30 different days', progress_total: 30 },
  { key: 'liter_3',          emoji: '🚿', category: 'agua', difficulty: 'hard',   label_es: 'Súper hidratado',     label_en: 'Super hydrated',     desc_es: 'Bebe 3,000 ml en un solo día',                    desc_en: 'Drink 3,000 ml in a single day' },

  // --- peso ---
  { key: 'first_weight',       emoji: '⚖️', category: 'peso', difficulty: 'easy',   label_es: 'Primer pesaje',       label_en: 'First weigh-in',     desc_es: 'Registra tu primer peso',                   desc_en: 'Log your first weight' },
  { key: 'weight_7',           emoji: '📊', category: 'peso', difficulty: 'easy',   label_es: '7 pesajes',           label_en: '7 weigh-ins',        desc_es: 'Registra tu peso 7 veces',                  desc_en: 'Log your weight 7 times', progress_total: 7 },
  { key: 'weight_30',          emoji: '📈', category: 'peso', difficulty: 'medium', label_es: '30 pesajes',          label_en: '30 weigh-ins',       desc_es: 'Registra tu peso 30 veces',                 desc_en: 'Log your weight 30 times', progress_total: 30 },
  { key: 'consistent_weight',  emoji: '🔄', category: 'peso', difficulty: 'medium', label_es: 'Peso consistente',    label_en: 'Consistent weight',  desc_es: 'Registra peso 14 días seguidos',            desc_en: 'Log weight 14 days in a row', progress_total: 14 },
  { key: 'weight_loss_5',      emoji: '📉', category: 'peso', difficulty: 'hard',   label_es: 'Menos 5 kg',          label_en: 'Minus 5 kg',         desc_es: 'Pierde 5 kg desde tu primer registro',      desc_en: 'Lose 5 kg from your first record', progress_total: 5 },
  { key: 'goal_reached',       emoji: '🏆', category: 'peso', difficulty: 'hard',   label_es: 'Meta alcanzada',      label_en: 'Goal reached',       desc_es: 'Llega a tu peso objetivo',                  desc_en: 'Reach your target weight' },

  // --- presion ---
  { key: 'first_bp',          emoji: '❤️', category: 'presion', difficulty: 'easy',   label_es: 'Primera lectura',      label_en: 'First reading',       desc_es: 'Toma tu primera medición de presión',              desc_en: 'Take your first blood pressure reading' },
  { key: 'bp_morning',        emoji: '🌅', category: 'presion', difficulty: 'easy',   label_es: 'Control matutino',     label_en: 'Morning check',       desc_es: 'Registra presión antes de las 9am',                desc_en: 'Log blood pressure before 9am' },
  { key: 'bp_monitor_7',      emoji: '🩺', category: 'presion', difficulty: 'medium', label_es: '7 días de presión',    label_en: '7 days of BP',        desc_es: 'Mide tu presión 7 días distintos',                 desc_en: 'Measure your BP on 7 different days', progress_total: 7 },
  { key: 'bp_monitor_30',     emoji: '🫀', category: 'presion', difficulty: 'hard',   label_es: 'Mes cardíaco',         label_en: 'Cardiac month',       desc_es: 'Mide tu presión 30 días distintos',                desc_en: 'Measure your BP on 30 different days', progress_total: 30 },
  { key: 'bp_normal_streak',  emoji: '💚', category: 'presion', difficulty: 'hard',   label_es: 'Presión normal',       label_en: 'Normal pressure',     desc_es: 'Obtén 7 lecturas consecutivas en rango normal',    desc_en: 'Get 7 consecutive readings in normal range', progress_total: 7 },

  // --- ayuno ---
  { key: 'first_fast',        emoji: '⏳', category: 'ayuno', difficulty: 'easy',   label_es: 'Primer ayuno',         label_en: 'First fast',         desc_es: 'Completa tu primer ayuno',                desc_en: 'Complete your first fast' },
  { key: 'early_fast',        emoji: '🌙', category: 'ayuno', difficulty: 'easy',   label_es: 'Inicio nocturno',      label_en: 'Night start',        desc_es: 'Inicia un ayuno después de las 8pm',      desc_en: 'Start a fast after 8pm' },
  { key: 'fast_master_10',    emoji: '⚡', category: 'ayuno', difficulty: 'medium', label_es: '10 ayunos',            label_en: '10 fasts',           desc_es: 'Completa 10 ayunos exitosamente',          desc_en: 'Complete 10 fasts successfully', progress_total: 10 },
  { key: 'fast_master_25',    emoji: '🌟', category: 'ayuno', difficulty: 'hard',   label_es: '25 ayunos',            label_en: '25 fasts',           desc_es: 'Completa 25 ayunos exitosamente',          desc_en: 'Complete 25 fasts successfully', progress_total: 25 },
  { key: 'fast_24h',          emoji: '🦁', category: 'ayuno', difficulty: 'hard',   label_es: 'Ayuno de 24h',         label_en: '24h fast',           desc_es: 'Completa un ayuno de 24 horas',            desc_en: 'Complete a 24-hour fast' },
  { key: 'fast_streak_7',     emoji: '🔥', category: 'ayuno', difficulty: 'hard',   label_es: 'Racha de ayunos',      label_en: 'Fasting streak',     desc_es: 'Completa ayunos 7 días seguidos',          desc_en: 'Complete fasts 7 days in a row', progress_total: 7 },

  // --- habitos ---
  { key: 'habit_first',       emoji: '✅', category: 'habitos', difficulty: 'easy',   label_es: 'Primer hábito',       label_en: 'First habit',        desc_es: 'Completa un hábito por primera vez',            desc_en: 'Complete a habit for the first time' },
  { key: 'habit_custom',      emoji: '🎨', category: 'habitos', difficulty: 'easy',   label_es: 'Creador',             label_en: 'Creator',            desc_es: 'Crea tu primer hábito personalizado',           desc_en: 'Create your first custom habit' },
  { key: 'habit_all_day',     emoji: '🌟', category: 'habitos', difficulty: 'easy',   label_es: 'Día perfecto',        label_en: 'Perfect day',        desc_es: 'Completa todos tus hábitos en un día',          desc_en: 'Complete all your habits in one day' },
  { key: 'habit_all_week',    emoji: '🏅', category: 'habitos', difficulty: 'medium', label_es: 'Semana perfecta',     label_en: 'Perfect week',       desc_es: 'Completa todos los hábitos 7 días seguidos',    desc_en: 'Complete all habits 7 days in a row', progress_total: 7 },
  { key: 'habit_30_days',     emoji: '🎖️', category: 'habitos', difficulty: 'hard',   label_es: 'Mes de hábitos',      label_en: 'Habit month',        desc_es: 'Completa todos los hábitos en 30 días distintos', desc_en: 'Complete all habits on 30 different days', progress_total: 30 },

  // --- constancia ---
  { key: 'weekend_warrior',   emoji: '🎉', category: 'constancia', difficulty: 'easy',   label_es: 'Guerrero fin de semana', label_en: 'Weekend warrior',  desc_es: 'Registra datos un sábado Y un domingo',      desc_en: 'Log data on a Saturday AND a Sunday' },
  { key: 'streak_3',          emoji: '🌱', category: 'constancia', difficulty: 'easy',   label_es: 'Racha de 3 días',       label_en: '3-day streak',     desc_es: 'Registra datos 3 días seguidos',             desc_en: 'Log data 3 days in a row', progress_total: 3 },
  { key: 'streak_7',          emoji: '🔥', category: 'constancia', difficulty: 'medium', label_es: 'Racha de 7 días',       label_en: '7-day streak',     desc_es: 'Registra datos 7 días seguidos',             desc_en: 'Log data 7 days in a row', progress_total: 7 },
  { key: 'streak_30',         emoji: '💎', category: 'constancia', difficulty: 'hard',   label_es: 'Racha de 30 días',      label_en: '30-day streak',    desc_es: 'Registra datos 30 días seguidos',            desc_en: 'Log data 30 days in a row', progress_total: 30 },

  // --- explorador ---
  { key: 'first_recipe',   emoji: '👨‍🍳', category: 'explorador', difficulty: 'easy',   label_es: 'Primera receta',      label_en: 'First recipe',       desc_es: 'Crea tu primera receta',                       desc_en: 'Create your first recipe' },
  { key: 'first_coach',    emoji: '🤖',   category: 'explorador', difficulty: 'easy',   label_es: 'Coach activado',      label_en: 'Coach activated',    desc_es: 'Usa el coach de IA por primera vez',           desc_en: 'Use the AI coach for the first time' },
  { key: 'first_scan',     emoji: '📷',   category: 'explorador', difficulty: 'easy',   label_es: 'Escáner',             label_en: 'Scanner',            desc_es: 'Registra un alimento usando el escáner',       desc_en: 'Log a food item using the scanner' },
  { key: 'recipe_5',       emoji: '📖',   category: 'explorador', difficulty: 'medium', label_es: 'Coleccionista',       label_en: 'Collector',          desc_es: 'Crea 5 recetas',                               desc_en: 'Create 5 recipes', progress_total: 5 },
  { key: 'coach_week',     emoji: '🧠',   category: 'explorador', difficulty: 'medium', label_es: 'Semana con coach',    label_en: 'Week with coach',    desc_es: 'Usa el coach de IA 7 días distintos',          desc_en: 'Use the AI coach on 7 different days', progress_total: 7 },
  { key: 'all_modules',    emoji: '🗺️',   category: 'explorador', difficulty: 'hard',   label_es: 'Explorador total',    label_en: 'Total explorer',     desc_es: 'Visita todas las secciones de la app',         desc_en: 'Visit all sections of the app' },

  // --- elite ---
  { key: 'triple_crown',        emoji: '🎗️', category: 'elite', difficulty: 'elite', label_es: 'Triple corona',      label_en: 'Triple crown',      desc_es: 'Cumple meta de agua, calorías y todos los hábitos el mismo día', desc_en: 'Hit water goal, calorie goal, and all habits on the same day' },
  { key: 'health_champion',     emoji: '👑',  category: 'elite', difficulty: 'elite', label_es: 'Campeón de salud',   label_en: 'Health champion',   desc_es: 'Desbloquea 30 logros distintos',                                 desc_en: 'Unlock 30 different achievements', progress_total: 30 },
  { key: 'year_active',         emoji: '🏯',  category: 'elite', difficulty: 'elite', label_es: 'Un año activo',      label_en: 'One year active',   desc_es: 'Registra datos en 365 días distintos',                          desc_en: 'Log data on 365 different days', progress_total: 365 },
  { key: 'consistency_master',  emoji: '⭐',  category: 'elite', difficulty: 'elite', label_es: 'Maestro total',      label_en: 'Total master',      desc_es: 'Desbloquea streak_30, hydrated_30, habit_30_days y food_tracker_100', desc_en: 'Unlock streak_30, hydrated_30, habit_30_days and food_tracker_100' },
]

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function uniqueDates(rows, field) {
  return [...new Set(rows.map(r => toDateStr(r[field])))]
}

function calcStreak(sortedDatesDesc) {
  if (!sortedDatesDesc.length) return 0
  let streak = 0
  const expected = new Date()
  expected.setHours(0, 0, 0, 0)
  for (const dateStr of sortedDatesDesc) {
    const d = new Date(dateStr + 'T00:00:00')
    const diff = (expected - d) / 86400000
    if (diff <= 1) { streak++; expected.setTime(d.getTime()) } else break
  }
  return streak
}

function sortDesc(dates) {
  return [...dates].sort((a, b) => (a < b ? 1 : -1))
}

// ─── batch check (non-hook) ───────────────────────────────────────────────

const THROTTLE_MS = 300_000 // 5 min

export async function runBadgeChecks(profileId) {
  if (!profileId) return {}
  const THROTTLE_KEY = `badge_check_${profileId}`
  const last = sessionStorage.getItem(THROTTLE_KEY)
  if (last && Date.now() - parseInt(last) < THROTTLE_MS) return {}
  sessionStorage.setItem(THROTTLE_KEY, Date.now().toString())

  // Fetch existing badges so we can skip already-unlocked ones
  const { data: existingBadges } = await supabase
    .from('badges')
    .select('badge_key')
    .eq('profile_id', profileId)
  const unlockedKeys = new Set((existingBadges || []).map(b => b.badge_key))

  const has = (key) => unlockedKeys.has(key)

  // Parallel queries
  const [foodRes, waterRes, bpRes, weightRes, fastRes, habitLogRes, habitsRes, recipeRes, coachRes, profileRes] = await Promise.all([
    supabase.from('food_logs').select('logged_at, meal_type, calories, protein_g, carbs_g, fat_g').eq('profile_id', profileId),
    supabase.from('water_logs').select('logged_at, amount_ml').eq('profile_id', profileId),
    supabase.from('bp_readings').select('recorded_at, systolic, diastolic').eq('profile_id', profileId).order('recorded_at', { ascending: false }),
    supabase.from('weight_logs').select('recorded_at, weight_kg').eq('profile_id', profileId).order('recorded_at', { ascending: true }),
    supabase.from('fasting_sessions').select('start_time, end_time, completed, target_hours').eq('profile_id', profileId).eq('completed', true),
    supabase.from('habit_logs').select('completed_date, habit_id').eq('profile_id', profileId),
    supabase.from('habits').select('id').eq('profile_id', profileId).eq('is_active', true),
    supabase.from('recipes').select('created_at').eq('profile_id', profileId),
    supabase.from('daily_analyses').select('analysis_date').eq('profile_id', profileId),
    supabase.from('profiles').select('weight_goal_kg, water_goal_ml, calorie_goal').eq('id', profileId).maybeSingle(),
  ])

  const foodLogs    = foodRes.data    || []
  const waterLogs   = waterRes.data   || []
  const bpReadings  = bpRes.data      || []
  const weightLogs  = weightRes.data  || []
  const fasts       = fastRes.data    || []
  const habitLogs   = habitLogRes.data || []
  const habits      = habitsRes.data  || []
  const recipes     = recipeRes.data  || []
  const coachLogs   = coachRes.data   || []
  const profile     = profileRes.data || {}

  const waterGoal    = profile.water_goal_ml    || 2000
  const calorieGoal  = profile.calorie_goal     || 2000

  // ── derived data ──────────────────────────────────────────────────────

  // Food: distinct days
  const foodDays = uniqueDates(foodLogs, 'logged_at')
  const foodDaysCount = foodDays.length

  // Food: days where all three meal types logged
  const mealsByDay = {}
  foodLogs.forEach(f => {
    const d = toDateStr(f.logged_at)
    if (!mealsByDay[d]) mealsByDay[d] = new Set()
    mealsByDay[d].add(f.meal_type)
  })

  // Food: days meeting calorie goal (within 10%)
  const calorieByDay = {}
  foodLogs.forEach(f => {
    const d = toDateStr(f.logged_at)
    calorieByDay[d] = (calorieByDay[d] || 0) + (f.calories || 0)
  })
  const calGoalDays = Object.values(calorieByDay).filter(c => c >= calorieGoal * 0.9 && c <= calorieGoal * 1.2).length

  // Food: days with all macros logged
  const macroDaySet = new Set()
  foodLogs.forEach(f => {
    if (f.protein_g && f.carbs_g && f.fat_g) macroDaySet.add(toDateStr(f.logged_at))
  })
  const macroDaysCount = macroDaySet.size

  // Water: daily totals
  const waterByDay = {}
  waterLogs.forEach(w => {
    const d = toDateStr(w.logged_at)
    waterByDay[d] = (waterByDay[d] || 0) + (w.amount_ml || 0)
  })
  const waterGoalDays = Object.entries(waterByDay).filter(([, ml]) => ml >= waterGoal).map(([d]) => d)
  const waterGoalDaysCount = waterGoalDays.length

  // Water streak of goal days
  const waterGoalStreak = calcStreak(sortDesc(waterGoalDays))

  // Weight
  const weightCount = weightLogs.length
  const weightDates = uniqueDates(weightLogs, 'recorded_at')
  const weightStreak = calcStreak(sortDesc(weightDates))
  let weightLoss = 0
  if (weightLogs.length >= 2) {
    weightLoss = weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg
  }

  // BP
  const bpDays = uniqueDates(bpReadings, 'recorded_at')
  const bpDaysCount = bpDays.length
  let bpNormalStreak = 0
  for (const r of bpReadings) {
    if (r.systolic < 130 && r.diastolic < 80) bpNormalStreak++
    else break
  }

  // Fasting
  const fastCount = fasts.length
  const fastDays = uniqueDates(fasts, 'start_time')
  const fastStreakVal = calcStreak(sortDesc(fastDays))

  // Habits: days where all habits completed
  const habitIds = new Set(habits.map(h => h.id))
  const habitTotal = habitIds.size
  const habitLogsByDay = {}
  habitLogs.forEach(l => {
    const d = l.completed_date
    if (!habitLogsByDay[d]) habitLogsByDay[d] = new Set()
    habitLogsByDay[d].add(l.habit_id)
  })
  const perfectHabitDays = habitTotal > 0
    ? Object.entries(habitLogsByDay).filter(([, s]) => s.size >= habitTotal).map(([d]) => d)
    : []
  const perfectHabitDaysCount = perfectHabitDays.length
  const habitWeekStreak = calcStreak(sortDesc(perfectHabitDays))

  // Coach
  const coachDaysCount = uniqueDates(coachLogs, 'analysis_date').length

  // Recipes
  const recipesCount = recipes.length

  // Global streak (union of all activity days)
  const allDays = sortDesc([...new Set([
    ...uniqueDates(foodLogs, 'logged_at'),
    ...uniqueDates(waterLogs, 'logged_at'),
    ...uniqueDates(weightLogs, 'recorded_at'),
    ...uniqueDates(bpReadings, 'recorded_at'),
  ])])
  const globalStreak = calcStreak(allDays)
  const allDaysCount = new Set(allDays).size

  // Weekend warrior
  const hasWeekend = allDays.some(d => new Date(d + 'T12:00:00').getDay() === 6) &&
                     allDays.some(d => new Date(d + 'T12:00:00').getDay() === 0)

  // ── badge stats for progress display ──────────────────────────────────
  const stats = {
    food_tracker_7:   { current: Math.min(foodDaysCount, 7),    total: 7 },
    food_tracker_30:  { current: Math.min(foodDaysCount, 30),   total: 30 },
    food_tracker_100: { current: Math.min(foodDaysCount, 100),  total: 100 },
    calorie_goal_3:   { current: Math.min(calGoalDays, 3),      total: 3 },
    calorie_goal_21:  { current: Math.min(calGoalDays, 21),     total: 21 },
    macro_master:     { current: Math.min(macroDaysCount, 15),  total: 15 },
    hydrated_7:       { current: Math.min(waterGoalDaysCount, 7),   total: 7 },
    water_streak_5:   { current: Math.min(waterGoalStreak, 5),      total: 5 },
    hydrated_30:      { current: Math.min(waterGoalDaysCount, 30),  total: 30 },
    weight_7:         { current: Math.min(weightCount, 7),  total: 7 },
    weight_30:        { current: Math.min(weightCount, 30), total: 30 },
    consistent_weight:{ current: Math.min(weightStreak, 14), total: 14 },
    weight_loss_5:    { current: Math.min(Math.max(weightLoss, 0), 5), total: 5 },
    bp_monitor_7:     { current: Math.min(bpDaysCount, 7),  total: 7 },
    bp_monitor_30:    { current: Math.min(bpDaysCount, 30), total: 30 },
    bp_normal_streak: { current: Math.min(bpNormalStreak, 7), total: 7 },
    fast_master_10:   { current: Math.min(fastCount, 10), total: 10 },
    fast_master_25:   { current: Math.min(fastCount, 25), total: 25 },
    fast_streak_7:    { current: Math.min(fastStreakVal, 7), total: 7 },
    habit_all_week:   { current: Math.min(habitWeekStreak, 7), total: 7 },
    habit_30_days:    { current: Math.min(perfectHabitDaysCount, 30), total: 30 },
    recipe_5:         { current: Math.min(recipesCount, 5), total: 5 },
    coach_week:       { current: Math.min(coachDaysCount, 7), total: 7 },
    streak_3:         { current: Math.min(globalStreak, 3),   total: 3 },
    streak_7:         { current: Math.min(globalStreak, 7),   total: 7 },
    streak_30:        { current: Math.min(globalStreak, 30),  total: 30 },
    year_active:      { current: Math.min(allDaysCount, 365), total: 365 },
    health_champion:  { current: Math.min(unlockedKeys.size, 30), total: 30 },
  }

  // ── evaluate & unlock ─────────────────────────────────────────────────
  const toUnlock = []

  const check = (key, condition) => { if (!has(key) && condition) toUnlock.push(key) }

  // nutricion
  check('first_log',        foodDaysCount >= 1)
  check('meal_variety_day', Object.values(mealsByDay).some(s => s.has('breakfast') && s.has('lunch') && s.has('dinner')))
  check('food_tracker_7',   foodDaysCount >= 7)
  check('night_snack',      foodLogs.some(f => f.meal_type === 'dinner' && new Date(f.logged_at).getHours() >= 21))
  check('early_bird',       foodLogs.some(f => f.meal_type === 'breakfast' && new Date(f.logged_at).getHours() < 8))
  check('calorie_goal_3',   calGoalDays >= 3)
  check('food_tracker_30',  foodDaysCount >= 30)
  check('calorie_goal_21',  calGoalDays >= 21)
  check('macro_master',     macroDaysCount >= 15)
  check('food_tracker_100', foodDaysCount >= 100)

  // agua
  check('first_water',    waterLogs.length >= 1)
  check('hydrated_1',     waterGoalDaysCount >= 1)
  check('hydrated_7',     waterGoalDaysCount >= 7)
  check('water_streak_5', waterGoalStreak >= 5)
  check('hydrated_30',    waterGoalDaysCount >= 30)
  check('liter_3',        Object.values(waterByDay).some(ml => ml >= 3000))

  // peso
  check('first_weight',      weightCount >= 1)
  check('weight_7',          weightCount >= 7)
  check('weight_30',         weightCount >= 30)
  check('consistent_weight', weightStreak >= 14)
  check('weight_loss_5',     weightLoss >= 5)
  // goal_reached checked inline

  // presion
  check('first_bp',         bpReadings.length >= 1)
  check('bp_morning',       bpReadings.some(r => new Date(r.recorded_at).getHours() < 9))
  check('bp_monitor_7',     bpDaysCount >= 7)
  check('bp_monitor_30',    bpDaysCount >= 30)
  check('bp_normal_streak', bpNormalStreak >= 7)

  // ayuno
  check('first_fast',     fastCount >= 1)
  check('early_fast',     fasts.some(f => new Date(f.start_time).getHours() >= 20))
  check('fast_master_10', fastCount >= 10)
  check('fast_master_25', fastCount >= 25)
  check('fast_24h',       fasts.some(f => {
    if (!f.end_time) return false
    const hours = (new Date(f.end_time) - new Date(f.start_time)) / 3600000
    return hours >= 24
  }))
  check('fast_streak_7',  fastStreakVal >= 7)

  // habitos
  check('habit_first',    habitLogs.length >= 1)
  // habit_custom and habit_all_day checked inline
  check('habit_all_week', habitWeekStreak >= 7)
  check('habit_30_days',  perfectHabitDaysCount >= 30)

  // constancia
  check('weekend_warrior', hasWeekend)
  check('streak_3',  globalStreak >= 3)
  check('streak_7',  globalStreak >= 7)
  check('streak_30', globalStreak >= 30)

  // explorador
  check('recipe_5',   recipesCount >= 5)
  check('coach_week', coachDaysCount >= 7)
  // first_recipe, first_coach, first_scan, all_modules checked inline

  // elite
  const CONSISTENCY_KEYS = ['streak_30', 'hydrated_30', 'habit_30_days', 'food_tracker_100']
  check('health_champion',    unlockedKeys.size + toUnlock.length >= 30)
  check('year_active',        allDaysCount >= 365)
  check('consistency_master', CONSISTENCY_KEYS.every(k => unlockedKeys.has(k) || toUnlock.includes(k)))

  // Insert unlocked badges
  const newlyUnlocked = []
  for (const key of toUnlock) {
    try {
      const { data } = await supabase
        .from('badges')
        .insert([{ profile_id: profileId, badge_key: key }])
        .select()
        .single()
      if (data) {
        newlyUnlocked.push(data)
        unlockedKeys.add(key)
      }
    } catch { /* ignore duplicates */ }
  }

  // Re-check elite after batch
  if (!has('health_champion') && unlockedKeys.size >= 30) {
    try {
      await supabase.from('badges').insert([{ profile_id: profileId, badge_key: 'health_champion' }])
    } catch { /* ignore */ }
  }
  if (!has('consistency_master') && CONSISTENCY_KEYS.every(k => unlockedKeys.has(k))) {
    try {
      await supabase.from('badges').insert([{ profile_id: profileId, badge_key: 'consistency_master' }])
    } catch { /* ignore */ }
  }

  return { newlyUnlocked, stats }
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useBadges(profileId) {
  const [badges, setBadges] = useState([])
  const [newBadge, setNewBadge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [badgeStats, setBadgeStats] = useState({})

  const fetchBadges = useCallback(async () => {
    if (!profileId) { setBadges([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('profile_id', profileId)
    setBadges(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchBadges() }, [fetchBadges])

  const hasBadge = (key) => badges.some(b => b.badge_key === key)

  const checkAndUnlock = async (key, condition) => {
    if (!profileId || !condition || hasBadge(key)) return null
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert([{ profile_id: profileId, badge_key: key }])
        .select()
        .single()
      if (error) return null
      setBadges(prev => [...prev, data])
      const badgeDef = ALL_BADGES.find(b => b.key === key)
      if (badgeDef) setNewBadge(badgeDef)
      return data
    } catch {
      return null
    }
  }

  const clearNewBadge = () => setNewBadge(null)

  const runChecks = useCallback(async () => {
    const result = await runBadgeChecks(profileId)
    if (result?.newlyUnlocked?.length) {
      await fetchBadges()
      const last = result.newlyUnlocked[result.newlyUnlocked.length - 1]
      const def = ALL_BADGES.find(b => b.key === last.badge_key)
      if (def) setNewBadge(def)
    }
    if (result?.stats) setBadgeStats(result.stats)
  }, [profileId, fetchBadges])

  return { badges, newBadge, loading, hasBadge, checkAndUnlock, clearNewBadge, refetch: fetchBadges, runChecks, badgeStats }
}

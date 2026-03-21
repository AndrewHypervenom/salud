// Mifflin-St Jeor BMR formula
// Male:   BMR = 10*w + 6.25*h - 5*a + 5
// Female: BMR = 10*w + 6.25*h - 5*a - 161

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/**
 * Calculate BMR using Mifflin-St Jeor
 * @param {number} weight_kg
 * @param {number} height_cm
 * @param {number} age
 * @param {'male'|'female'} sex
 * @returns {number} BMR in kcal
 */
export function calcBMR(weight_kg, height_cm, age, sex) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

/**
 * Calculate TDEE
 * @param {number} bmr
 * @param {string} activity
 * @returns {number} TDEE in kcal
 */
export function calcTDEE(bmr, activity = 'sedentary') {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity] || 1.2))
}

/**
 * Calculate macronutrient distribution
 * Protein 25%, Fat 30%, Carbs 45%
 * @param {number} tdee
 * @returns {{ protein_kcal, fat_kcal, carbs_kcal, protein_g, fat_g, carbs_g }}
 */
export function calcMacros(tdee) {
  const protein_kcal = Math.round(tdee * 0.25)
  const fat_kcal = Math.round(tdee * 0.30)
  const carbs_kcal = Math.round(tdee * 0.45)

  return {
    protein_kcal,
    fat_kcal,
    carbs_kcal,
    protein_g: Math.round(protein_kcal / 4),
    fat_g: Math.round(fat_kcal / 9),
    carbs_g: Math.round(carbs_kcal / 4),
  }
}

/**
 * Get activity multiplier label
 */
export function getActivityMultiplier(activity) {
  return ACTIVITY_MULTIPLIERS[activity] || 1.2
}

/**
 * Classify calorie intake vs goal into 3 states
 * @param {number} todayCalories
 * @param {number} tdee
 * @returns {'ok'|'warn'|'over'}
 */
export function getCalorieStatus(todayCalories, tdee) {
  if (tdee <= 0) return 'ok'
  const pct = (todayCalories / tdee) * 100
  if (pct > 100) return 'over'
  if (pct >= 80) return 'warn'
  return 'ok'
}

export const CALORIE_COLORS = {
  ok:   { text: 'text-primary-600', bar: 'bg-primary-500' },
  warn: { text: 'text-amber-600',   bar: 'bg-amber-500' },
  over: { text: 'text-red-600',     bar: 'bg-red-500' },
}

export const HEALTH_GOAL_ADJUSTMENTS = {
  lose_weight:     -300,
  maintain:           0,
  gain_muscle:     +200,
  improve_health:     0,  // igual que maintain — foco en hábitos
}

export function calcCalorieTarget(tdee, healthGoal = 'maintain') {
  const adjustment = HEALTH_GOAL_ADJUSTMENTS[healthGoal] ?? 0
  return Math.max(1200, tdee + adjustment)
}

/**
 * Calculates how many extra calories to eat after exercise, based on health goal.
 *
 * Why not 100%?
 * - TDEE already includes an activity multiplier, so the base target is not "sedentary zero"
 * - For weight loss, eating back all calories defeats the purpose of exercising
 * - For muscle gain, full replenishment + small surplus is needed
 *
 * Returns: { extraCals, eatBackPct, rationale }
 */
export function calcExerciseEatBack(caloriesBurned, healthGoal = 'maintain') {
  if (!caloriesBurned || caloriesBurned <= 0) return { extraCals: 0, eatBackPct: 0, rationale: null }

  const PCT = {
    lose_weight:    0.40,  // Maintain most of the deficit — exercise is your edge, not a meal ticket
    maintain:       0.70,  // Partial replenishment — you exercised beyond your normal activity
    gain_muscle:    1.00,  // Full replenishment — muscle synthesis needs the energy
    improve_health: 0.55,  // Moderate top-up — focus on quality, not quantity
  }

  const RATIONALE = {
    lose_weight:    'lose_weight',
    maintain:       'maintain',
    gain_muscle:    'gain_muscle',
    improve_health: 'improve_health',
  }

  const pct = PCT[healthGoal] ?? 0.60
  const extraCals = Math.round(caloriesBurned * pct)
  return { extraCals, eatBackPct: Math.round(pct * 100), rationale: RATIONALE[healthGoal] }
}

export function calcCalorieTargetMulti(tdee, goals = []) {
  if (!goals || goals.length === 0) return Math.max(1200, tdee)
  if (goals.length === 1) return calcCalorieTarget(tdee, goals[0])
  const total = goals.reduce((sum, g) => sum + (HEALTH_GOAL_ADJUSTMENTS[g] ?? 0), 0)
  return Math.max(1200, tdee + Math.round(total / goals.length))
}

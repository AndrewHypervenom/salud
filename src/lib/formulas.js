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

/**
 * weightEstimation.js — Pure JS functions for AI-based weight estimation,
 * recommendations, and motivational phrases. No React dependencies.
 */

/**
 * Calculate a day-by-day estimated weight series based on caloric balance.
 *
 * @param {Array<{logged_date: string, weight_kg: number}>} weightLogs - Manual weight logs (any order)
 * @param {Object} foodLogsByDay - { 'YYYY-MM-DD': { totalCal: number } }
 * @param {Object} exerciseLogsByDay - { 'YYYY-MM-DD': { totalBurned: number } }
 * @param {number} tdee - Total Daily Energy Expenditure (pure maintenance calories)
 * @param {number} profileWeight - Fallback starting weight if no manual logs
 * @returns {Array<{date: string, weight_kg: number}>} Ascending series, only days with food data
 */
export function calcEstimatedWeightSeries(weightLogs, foodLogsByDay, exerciseLogsByDay, tdee, profileWeight) {
  if (!tdee || !foodLogsByDay || Object.keys(foodLogsByDay).length === 0) return []

  const foodDates = Object.keys(foodLogsByDay).sort()
  if (foodDates.length === 0) return []

  // Build a lookup for manual weight logs by date
  const manualByDate = {}
  for (const log of (weightLogs || [])) {
    manualByDate[log.logged_date] = log.weight_kg
  }

  // Determine starting point: oldest manual log or profileWeight
  const sortedManual = [...(weightLogs || [])].sort((a, b) => a.logged_date.localeCompare(b.logged_date))
  const firstManual = sortedManual[0]
  const startDate = firstManual ? firstManual.logged_date : foodDates[0]
  let baseWeight = firstManual ? firstManual.weight_kg : (profileWeight || 70)

  // Get all dates from startDate to today
  const today = new Date().toLocaleDateString('en-CA')
  const allDates = []
  const cursor = new Date(startDate)
  const end = new Date(today)
  while (cursor <= end) {
    allDates.push(cursor.toLocaleDateString('en-CA'))
    cursor.setDate(cursor.getDate() + 1)
  }

  const result = []
  let currentWeight = baseWeight

  for (const date of allDates) {
    // Anchor: if there's a manual log for this date, reset base to real weight
    if (manualByDate[date] !== undefined) {
      currentWeight = manualByDate[date]
    }

    // Only generate estimated point if food was logged this day
    if (foodLogsByDay[date]) {
      const totalCal = foodLogsByDay[date].totalCal || 0
      const burned = (exerciseLogsByDay && exerciseLogsByDay[date]) ? (exerciseLogsByDay[date].totalBurned || 0) : 0
      const netCal = totalCal - burned
      const balance = netCal - tdee
      const deltaKg = balance / 7700
      currentWeight = Math.round((currentWeight + deltaKg) * 100) / 100
      result.push({ date, weight_kg: currentWeight })
    }
  }

  return result
}

/**
 * Get the most recent estimated weight point (closest to today).
 * @param {Array<{date: string, weight_kg: number}>} estimatedSeries
 * @returns {number|null}
 */
export function calcTodayEstimatedWeight(estimatedSeries) {
  if (!estimatedSeries || estimatedSeries.length === 0) return null
  return estimatedSeries[estimatedSeries.length - 1].weight_kg
}

/**
 * Aggregate daily caloric stats for the last N days.
 * @param {Object} foodLogsByDay
 * @param {Object} exerciseLogsByDay
 * @param {number} tdee
 * @param {number} days
 * @returns {{ avgNetBalance: number, daysOverTarget: number, compliancePct: number }}
 */
export function calcWeeklyStats(foodLogsByDay, exerciseLogsByDay, tdee, days = 7) {
  if (!foodLogsByDay || !tdee) return { avgNetBalance: 0, daysOverTarget: 0, compliancePct: 0 }

  const since = new Date(Date.now() - days * 86400000).toLocaleDateString('en-CA')
  const relevantDates = Object.keys(foodLogsByDay).filter(d => d >= since)

  if (relevantDates.length === 0) return { avgNetBalance: 0, daysOverTarget: 0, compliancePct: 0 }

  let totalBalance = 0
  let daysOver = 0

  for (const date of relevantDates) {
    const cal = foodLogsByDay[date]?.totalCal || 0
    const burned = exerciseLogsByDay?.[date]?.totalBurned || 0
    const net = cal - burned
    const balance = net - tdee
    totalBalance += balance
    if (net > tdee) daysOver++
  }

  const avgNetBalance = Math.round(totalBalance / relevantDates.length)
  const compliancePct = Math.round(((relevantDates.length - daysOver) / relevantDates.length) * 100)

  return { avgNetBalance, daysOverTarget: daysOver, compliancePct }
}

/**
 * Get top 3 most frequent foods from raw food logs.
 * @param {Array<{description: string, calories_estimated: number}>} rawLogs
 * @returns {Array<{description: string, count: number, totalCal: number}>}
 */
export function getTopFoods(rawLogs) {
  if (!rawLogs || rawLogs.length === 0) return []

  const freq = {}
  for (const log of rawLogs) {
    if (!log.description) continue
    const key = log.description.toLowerCase().trim()
    if (!freq[key]) freq[key] = { description: log.description, count: 0, totalCal: 0 }
    freq[key].count++
    freq[key].totalCal += log.calories_estimated || 0
  }

  return Object.values(freq)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}

/**
 * Generate a personalized weight recommendation based on trends and eating habits.
 * @param {number|null} weeklyChange - kg/week from manual logs (positive = gaining)
 * @param {number} avgNetBalance - Average daily caloric balance (positive = surplus)
 * @param {number} daysOverTarget - Days exceeding caloric target in last 7 days
 * @param {Array} topFoods - Result of getTopFoods()
 * @param {string} healthGoal - 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health'
 * @param {boolean} hasRecentLogs - Has food logs in the last 3 days
 * @returns {{ type: string, topFood: string|null }}
 */
export function calcWeightRecommendation(weeklyChange, avgNetBalance, daysOverTarget, topFoods, healthGoal, hasRecentLogs) {
  const topFood = topFoods?.[0]?.description || null

  if (!hasRecentLogs) {
    return { type: 'no_data', topFood: null }
  }

  if (healthGoal === 'lose_weight') {
    if (weeklyChange !== null && weeklyChange < -0.2) {
      return { type: 'losing_good', topFood: null }
    }
    if (weeklyChange !== null && weeklyChange > 0.1) {
      return { type: 'gaining_bad', topFood }
    }
    if (daysOverTarget >= 4) {
      return { type: 'stagnant_over', topFood }
    }
    return { type: 'stagnant_low_cal', topFood: null }
  }

  if (healthGoal === 'gain_muscle') {
    if (weeklyChange !== null && weeklyChange > 0.1) {
      return { type: 'gaining_good', topFood: null }
    }
    if (weeklyChange !== null && weeklyChange < -0.1) {
      return { type: 'losing_bad', topFood: null }
    }
    return { type: 'stagnant_muscle', topFood: null }
  }

  // maintain / improve_health
  if (weeklyChange === null || Math.abs(weeklyChange) <= 0.3) {
    return { type: 'maintaining_good', topFood: null }
  }
  if (weeklyChange > 0.3) {
    return { type: 'gaining_maintain', topFood }
  }
  return { type: 'losing_maintain', topFood: null }
}

// Motivational phrases focused on encouraging daily app usage.
// goals: [] means all goals. trends: [] means all trends.
const PHRASES = [
  // --- Incentivo a registrar comidas ---
  {
    goals: [],
    trends: ['no_data'],
    es: '¡Registra tu primera comida hoy! La IA ya está lista para analizar tu progreso.',
    en: 'Log your first meal today! The AI is ready to analyze your progress.',
  },
  {
    goals: [],
    trends: ['no_data'],
    es: 'Cada comida que registras enseña a la app a conocerte mejor. ¡Empieza ahora!',
    en: 'Every meal you log helps the app know you better. Start now!',
  },
  {
    goals: [],
    trends: ['no_data'],
    es: 'La app solo puede ayudarte si le dices qué comes. ¡Regístralo todo hoy!',
    en: 'The app can only help you if you tell it what you eat. Log everything today!',
  },
  // --- Incentivo a pesar y registrar peso ---
  {
    goals: [],
    trends: [],
    es: '¿Ya te pesaste hoy? Registrarlo tarda 5 segundos y hace que tu gráfico cobre vida.',
    en: 'Did you weigh yourself today? Logging it takes 5 seconds and brings your chart to life.',
  },
  {
    goals: [],
    trends: [],
    es: 'Cuantos más registros de peso tengas, más precisa será la estimación de la IA.',
    en: 'The more weight entries you have, the more accurate the AI estimate becomes.',
  },
  // --- Celebrar que están usando la app ---
  {
    goals: [],
    trends: ['losing', 'stable', 'gaining'],
    es: '¡Estás usando la app! Eso ya te pone por delante del 90% de las personas que empiezan.',
    en: 'You\'re using the app! That already puts you ahead of 90% of people who start.',
  },
  {
    goals: [],
    trends: ['losing', 'stable'],
    es: 'La constancia de registrar es más valiosa que la dieta perfecta. ¡Sigue así!',
    en: 'The consistency of logging is more valuable than the perfect diet. Keep it up!',
  },
  // --- Por objetivo ---
  {
    goals: ['lose_weight'],
    trends: [],
    es: 'Cada alimento registrado es una decisión consciente. Eso es lo que cambia el cuerpo.',
    en: 'Every logged food is a conscious decision. That\'s what changes the body.',
  },
  {
    goals: ['lose_weight'],
    trends: ['losing'],
    es: 'La app ve tu progreso aunque tú no lo notes todavía. ¡Sigue registrando!',
    en: 'The app sees your progress even if you can\'t feel it yet. Keep logging!',
  },
  {
    goals: ['gain_muscle'],
    trends: [],
    es: 'Registra tu ejercicio hoy y deja que la IA calcule cuánto puedes comer de vuelta.',
    en: 'Log your workout today and let the AI calculate how much you can eat back.',
  },
  {
    goals: ['gain_muscle'],
    trends: ['gaining'],
    es: 'Cada registro de comida ayuda a la app a afinar tu plan de ganancia muscular.',
    en: 'Every food log helps the app fine-tune your muscle gain plan.',
  },
  {
    goals: ['maintain'],
    trends: [],
    es: 'Registrar hoy mantiene el control. Una semana de datos y la app trabaja por ti.',
    en: 'Logging today keeps you in control. One week of data and the app works for you.',
  },
  {
    goals: ['improve_health'],
    trends: [],
    es: 'Cada registro es evidencia de tu compromiso con tu salud. ¡No pares!',
    en: 'Every log is evidence of your commitment to your health. Don\'t stop!',
  },
  // --- Universales potentes ---
  {
    goals: [],
    trends: [],
    es: 'Los que registran lo que comen logran sus metas 3 veces más rápido. Tú ya lo haces.',
    en: 'People who track what they eat reach their goals 3x faster. You\'re already doing it.',
  },
  {
    goals: [],
    trends: [],
    es: 'Abre la app mañana temprano y registra tu desayuno. Ese hábito lo cambia todo.',
    en: 'Open the app tomorrow morning and log your breakfast. That habit changes everything.',
  },
]

/**
 * Get a contextually relevant motivational phrase.
 * @param {string} healthGoal
 * @param {'losing'|'gaining'|'stable'|'no_data'} trend
 * @param {boolean} hasRecentLogs
 * @param {'es'|'en'} lang
 * @returns {string}
 */
export function getMotivationalPhrase(healthGoal, trend, hasRecentLogs, lang = 'es') {
  const effectiveTrend = hasRecentLogs ? trend : 'no_data'

  const eligible = PHRASES.filter(p => {
    const goalMatch = p.goals.length === 0 || p.goals.includes(healthGoal)
    const trendMatch = p.trends.length === 0 || p.trends.includes(effectiveTrend)
    return goalMatch && trendMatch
  })

  const pool = eligible.length > 0 ? eligible : PHRASES.filter(p => p.goals.length === 0 && p.trends.length === 0)
  const chosen = pool[Math.floor(Math.random() * pool.length)]
  return chosen ? (lang === 'es' ? chosen.es : chosen.en) : ''
}

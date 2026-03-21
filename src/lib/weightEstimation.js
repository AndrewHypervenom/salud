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

// Motivational phrases: each has goals[], trends[], es, en
// goals: [] means all goals apply
// trends: [] means all trends apply
const PHRASES = [
  {
    goals: ['lose_weight'],
    trends: ['losing'],
    es: 'Cada día registrado es un paso hacia tu meta. ¡Vas muy bien!',
    en: 'Every logged day is a step toward your goal. You\'re doing great!',
  },
  {
    goals: [],
    trends: ['losing'],
    es: 'El cuerpo cambia antes de que la balanza lo muestre. Sigue así.',
    en: 'Your body changes before the scale shows it. Keep going.',
  },
  {
    goals: ['gain_muscle'],
    trends: ['gaining'],
    es: 'Los músculos pesan más que la grasa. Un poco de más es buena señal.',
    en: 'Muscle weighs more than fat. A little extra is a good sign.',
  },
  {
    goals: ['lose_weight'],
    trends: ['gaining'],
    es: 'Un día difícil no borra semanas de progreso. Vuelve al camino mañana.',
    en: 'One hard day doesn\'t erase weeks of progress. Get back on track tomorrow.',
  },
  {
    goals: [],
    trends: ['stable'],
    es: 'Mantener el peso también es un logro. Enfócate en los hábitos.',
    en: 'Maintaining weight is also an achievement. Focus on the habits.',
  },
  {
    goals: [],
    trends: ['no_data'],
    es: 'Registrar lo que comes es la herramienta más poderosa. ¡Empieza hoy!',
    en: 'Logging what you eat is the most powerful tool. Start today!',
  },
  {
    goals: [],
    trends: ['no_data'],
    es: 'Sin datos no hay progreso visible. Registra aunque sea una comida.',
    en: 'Without data there\'s no visible progress. Log at least one meal.',
  },
  {
    goals: ['lose_weight'],
    trends: [],
    es: 'La consistencia supera a la perfección. No necesitas hacerlo perfecto.',
    en: 'Consistency beats perfection. You don\'t need to be perfect.',
  },
  {
    goals: ['gain_muscle'],
    trends: [],
    es: 'La proteína es el ladrillo de tus músculos. ¿Ya cumpliste tu meta hoy?',
    en: 'Protein is the building block of your muscles. Did you hit your goal today?',
  },
  {
    goals: ['maintain'],
    trends: [],
    es: 'El equilibrio no es aburrido. Es la base de la salud a largo plazo.',
    en: 'Balance isn\'t boring. It\'s the foundation of long-term health.',
  },
  {
    goals: ['improve_health'],
    trends: [],
    es: 'Pequeños cambios, resultado enorme. Cada elección cuenta.',
    en: 'Small changes, huge results. Every choice counts.',
  },
  {
    goals: [],
    trends: ['losing'],
    es: 'Tu futuro yo te lo agradecerá. Un día a la vez.',
    en: 'Your future self will thank you. One day at a time.',
  },
  {
    goals: [],
    trends: [],
    es: 'La mente fit viene antes que el cuerpo fit. Tú ya tienes la mentalidad.',
    en: 'A fit mind comes before a fit body. You already have the mindset.',
  },
  {
    goals: [],
    trends: [],
    es: 'No te compares con ayer. Compárate con quien eras hace un mes.',
    en: 'Don\'t compare to yesterday. Compare to who you were a month ago.',
  },
  {
    goals: [],
    trends: ['no_data'],
    es: 'Los hábitos se forman con datos. Registra hoy y construye tu historia.',
    en: 'Habits are built with data. Log today and build your story.',
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

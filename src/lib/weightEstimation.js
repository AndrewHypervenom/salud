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
// trends: 'no_food' = no food logged recently
//         'no_weight' = has food logs but no weight entries yet
//         'losing' | 'gaining' | 'stable' = has weight trend data
//         [] = applies to all trends
const PHRASES = [
  // --- Sin comida registrada → incentivar registrar comidas ---
  {
    goals: [],
    trends: ['no_food'],
    es: 'Cuanto más registres, más inteligente se vuelve tu estimación de peso. ¡Empieza hoy!',
    en: 'The more you log, the smarter your weight estimate gets. Start today!',
  },
  {
    goals: [],
    trends: ['no_food'],
    es: 'La app tiene todo listo para ti. Solo necesita que le cuentes qué comiste.',
    en: 'The app has everything ready for you. It just needs you to tell it what you ate.',
  },
  {
    goals: [],
    trends: ['no_food'],
    es: 'Un registro al día es suficiente para empezar a ver el patrón. ¿Lo hacemos?',
    en: 'One log a day is enough to start seeing the pattern. Shall we?',
  },
  // --- Tiene comida pero no peso → incentivar a pesarse ---
  {
    goals: [],
    trends: ['no_weight'],
    es: '¡Ya estás registrando comidas! Ahora añade tu peso y la gráfica cobra vida.',
    en: 'You\'re already logging meals! Now add your weight and the chart comes alive.',
  },
  {
    goals: [],
    trends: ['no_weight'],
    es: 'La IA ya está estimando tu peso. Regístralo para ver qué tan acertada está.',
    en: 'The AI is already estimating your weight. Log it to see how accurate it is.',
  },
  {
    goals: [],
    trends: ['no_weight'],
    es: 'Pesarte y registrarlo tarda 10 segundos. Con eso la app te da análisis reales.',
    en: 'Weighing yourself and logging it takes 10 seconds. That gives the app real analysis.',
  },
  // --- Bajando de peso ---
  {
    goals: ['lose_weight'],
    trends: ['losing'],
    es: 'Tu constancia en la app está funcionando. ¡Cada registro cuenta!',
    en: 'Your consistency in the app is working. Every log counts!',
  },
  {
    goals: [],
    trends: ['losing'],
    es: 'La app ve tu progreso en tiempo real. Sigue registrando para no perder el hilo.',
    en: 'The app sees your progress in real time. Keep logging to stay on track.',
  },
  // --- Subiendo de peso ---
  {
    goals: ['lose_weight'],
    trends: ['gaining'],
    es: 'La app tiene la información para ayudarte a corregir el rumbo. ¡Úsala!',
    en: 'The app has the info to help you course-correct. Use it!',
  },
  {
    goals: ['gain_muscle'],
    trends: ['gaining'],
    es: 'Cada registro de comida ayuda a la app a afinar tu plan de ganancia. ¡Sigue!',
    en: 'Every food log helps the app fine-tune your gain plan. Keep going!',
  },
  // --- Estable ---
  {
    goals: [],
    trends: ['stable'],
    es: 'La constancia de registrar es más poderosa que la dieta perfecta. ¡Tú ya lo haces!',
    en: 'The habit of logging is more powerful than the perfect diet. You\'re already doing it!',
  },
  {
    goals: ['maintain', 'improve_health'],
    trends: ['stable'],
    es: 'Mantener el control con datos reales es el secreto. La app lo tiene todo.',
    en: 'Staying in control with real data is the secret. The app has it all.',
  },
  // --- Universales potentes (aplican a todos) ---
  {
    goals: [],
    trends: [],
    es: 'Registrar ejercicio hoy activa la estimación de peso de la IA. ¿Ya lo hiciste?',
    en: 'Logging exercise today activates the AI weight estimate. Did you do it?',
  },
  {
    goals: [],
    trends: [],
    es: 'Las personas que registran lo que comen alcanzan sus metas 3 veces más rápido.',
    en: 'People who track what they eat reach their goals 3x faster.',
  },
  {
    goals: [],
    trends: [],
    es: 'Cada dato que agregas hace que tu perfil sea más preciso. La app trabaja para ti.',
    en: 'Every data point you add makes your profile more accurate. The app works for you.',
  },
]

/**
 * Get a contextually relevant motivational phrase.
 * @param {string} healthGoal
 * @param {'losing'|'gaining'|'stable'|'no_weight'|'no_food'} trend
 * @param {'es'|'en'} lang
 * @returns {string}
 */
export function getMotivationalPhrase(healthGoal, trend, lang = 'es') {
  const eligible = PHRASES.filter(p => {
    const goalMatch = p.goals.length === 0 || p.goals.includes(healthGoal)
    const trendMatch = p.trends.length === 0 || p.trends.includes(trend)
    return goalMatch && trendMatch
  })

  const pool = eligible.length > 0 ? eligible : PHRASES.filter(p => p.goals.length === 0 && p.trends.length === 0)
  const chosen = pool[Math.floor(Math.random() * pool.length)]
  return chosen ? (lang === 'es' ? chosen.es : chosen.en) : ''
}

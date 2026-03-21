// MET values (kcal per kg per hour) for common exercises
export const EXERCISE_METS = {
  walking: 3.5,
  caminata: 3.5,
  running: 9.8,
  correr: 9.8,
  jogging: 7.0,
  trote: 7.0,
  cycling: 7.5,
  bicicleta: 7.5,
  ciclismo: 7.5,
  swimming: 8.0,
  natacion: 8.0,
  natación: 8.0,
  weights: 5.0,
  pesas: 5.0,
  gym: 5.0,
  gimnasio: 5.0,
  yoga: 2.5,
  stretching: 2.3,
  estiramiento: 2.3,
  soccer: 10.0,
  futbol: 10.0,
  fútbol: 10.0,
  basketball: 8.0,
  basquetbol: 8.0,
  basketball: 8.0,
  hiit: 8.0,
  aerobics: 6.5,
  aerobicos: 6.5,
  aeróbicos: 6.5,
  pilates: 3.0,
  dancing: 5.5,
  baile: 5.5,
  zumba: 6.0,
  elliptical: 5.0,
  eliptica: 5.0,
  elíptica: 5.0,
  stairs: 8.0,
  escaleras: 8.0,
  rowing: 7.0,
  remo: 7.0,
  crossfit: 9.0,
  default: 4.0,
}

// Exercise suggestions for autocomplete — each with name, type, and category
export const EXERCISE_SUGGESTIONS = [
  // Cardio
  { name: 'Correr', type: 'cardio', category: 'cardio' },
  { name: 'Caminata', type: 'cardio', category: 'cardio' },
  { name: 'Trote', type: 'cardio', category: 'cardio' },
  { name: 'Ciclismo', type: 'cardio', category: 'cardio' },
  { name: 'Spinning', type: 'cardio', category: 'cardio' },
  { name: 'Natación', type: 'cardio', category: 'cardio' },
  { name: 'HIIT', type: 'cardio', category: 'cardio' },
  { name: 'Elíptica', type: 'cardio', category: 'cardio' },
  { name: 'Remo', type: 'cardio', category: 'cardio' },
  { name: 'Saltar cuerda', type: 'cardio', category: 'cardio' },
  { name: 'Escaladora', type: 'cardio', category: 'cardio' },
  { name: 'Aeróbicos', type: 'cardio', category: 'cardio' },
  // Strength
  { name: 'Pesas', type: 'strength', category: 'strength' },
  { name: 'Sentadillas', type: 'strength', category: 'strength' },
  { name: 'Press de banca', type: 'strength', category: 'strength' },
  { name: 'Peso muerto', type: 'strength', category: 'strength' },
  { name: 'Dominadas', type: 'strength', category: 'strength' },
  { name: 'Crossfit', type: 'strength', category: 'strength' },
  { name: 'Calistenia', type: 'strength', category: 'strength' },
  { name: 'Flexiones', type: 'strength', category: 'strength' },
  { name: 'Fondos', type: 'strength', category: 'strength' },
  { name: 'Kettlebell', type: 'strength', category: 'strength' },
  { name: 'TRX', type: 'strength', category: 'strength' },
  // Flexibility
  { name: 'Yoga', type: 'flexibility', category: 'flexibility' },
  { name: 'Pilates', type: 'flexibility', category: 'flexibility' },
  { name: 'Estiramiento', type: 'flexibility', category: 'flexibility' },
  { name: 'Movilidad', type: 'flexibility', category: 'flexibility' },
  { name: 'Yoga restaurativo', type: 'flexibility', category: 'flexibility' },
  { name: 'Meditación activa', type: 'flexibility', category: 'flexibility' },
  // Sports
  { name: 'Fútbol', type: 'sports', category: 'sports' },
  { name: 'Baloncesto', type: 'sports', category: 'sports' },
  { name: 'Tenis', type: 'sports', category: 'sports' },
  { name: 'Pádel', type: 'sports', category: 'sports' },
  { name: 'Voleibol', type: 'sports', category: 'sports' },
  { name: 'Boxeo', type: 'sports', category: 'sports' },
  { name: 'Muay Thai', type: 'sports', category: 'sports' },
  { name: 'Artes marciales', type: 'sports', category: 'sports' },
  { name: 'Escalada', type: 'sports', category: 'sports' },
  { name: 'Parkour', type: 'sports', category: 'sports' },
  { name: 'Paddleboard', type: 'sports', category: 'sports' },
  { name: 'Surf', type: 'sports', category: 'sports' },
  { name: 'Senderismo', type: 'sports', category: 'sports' },
  // Dance
  { name: 'Pole Dance', type: 'sports', category: 'dance' },
  { name: 'Zumba', type: 'sports', category: 'dance' },
  { name: 'Baile', type: 'sports', category: 'dance' },
  { name: 'Salsa', type: 'sports', category: 'dance' },
  { name: 'Reggaetón fitness', type: 'sports', category: 'dance' },
  { name: 'Hip hop dance', type: 'sports', category: 'dance' },
  { name: 'Barre', type: 'flexibility', category: 'dance' },
  // Other
  { name: 'Caminata en agua', type: 'other', category: 'other' },
  { name: 'Jardinería intensa', type: 'other', category: 'other' },
  { name: 'Juego activo', type: 'other', category: 'other' },
]

/**
 * Estimates calories burned using MET formula
 * calories = MET × weight_kg × (duration_minutes / 60)
 */
export function estimateCaloriesBurned(exerciseName, durationMinutes, weightKg) {
  if (!exerciseName || !durationMinutes || !weightKg) return 0
  const key = exerciseName.toLowerCase().trim()
  const met = Object.entries(EXERCISE_METS).find(([k]) => key.includes(k))?.[1] ?? EXERCISE_METS.default
  return Math.round(met * weightKg * (durationMinutes / 60))
}

// Workout plans by experience level and health goal
// Each exercise has: name_key (i18n), sets (null = not applicable), reps (null), duration (seconds, null)
const WORKOUT_PLANS = {
  beginner: {
    lose_weight: {
      title_key: 'exercise.plan.beginner_lw_title',
      sessions: 4,
      focus_key: 'exercise.plan.focus_cardio_fat',
      exercises: [
        { name_key: 'exercise.plan.ex.brisk_walk', sets: null, reps: null, duration: 30 },
        { name_key: 'exercise.plan.ex.squat', sets: 3, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.push_up_modified', sets: 3, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.plank', sets: 3, reps: null, duration: 30 },
        { name_key: 'exercise.plan.ex.mountain_climber', sets: 3, reps: 20, duration: null },
      ],
    },
    gain_muscle: {
      title_key: 'exercise.plan.beginner_gm_title',
      sessions: 3,
      focus_key: 'exercise.plan.focus_strength_full',
      exercises: [
        { name_key: 'exercise.plan.ex.squat', sets: 3, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.push_up', sets: 3, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.lunge', sets: 3, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.dumbbell_row', sets: 3, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.plank', sets: 3, reps: null, duration: 45 },
      ],
    },
    improve_health: {
      title_key: 'exercise.plan.beginner_ih_title',
      sessions: 3,
      focus_key: 'exercise.plan.focus_general_fitness',
      exercises: [
        { name_key: 'exercise.plan.ex.walk_15min', sets: null, reps: null, duration: 15 },
        { name_key: 'exercise.plan.ex.squat', sets: 2, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.push_up_modified', sets: 2, reps: 8, duration: null },
        { name_key: 'exercise.plan.ex.stretch_full', sets: null, reps: null, duration: 10 },
      ],
    },
    maintain: {
      title_key: 'exercise.plan.beginner_m_title',
      sessions: 3,
      focus_key: 'exercise.plan.focus_balance',
      exercises: [
        { name_key: 'exercise.plan.ex.walk_20min', sets: null, reps: null, duration: 20 },
        { name_key: 'exercise.plan.ex.squat', sets: 2, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.push_up_modified', sets: 2, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.yoga_basic', sets: null, reps: null, duration: 15 },
      ],
    },
  },
  intermediate: {
    lose_weight: {
      title_key: 'exercise.plan.inter_lw_title',
      sessions: 5,
      focus_key: 'exercise.plan.focus_hiit_cardio',
      exercises: [
        { name_key: 'exercise.plan.ex.hiit_20min', sets: null, reps: null, duration: 20 },
        { name_key: 'exercise.plan.ex.squat_jump', sets: 4, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.burpee', sets: 3, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.push_up', sets: 3, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.plank', sets: 3, reps: null, duration: 60 },
      ],
    },
    gain_muscle: {
      title_key: 'exercise.plan.inter_gm_title',
      sessions: 4,
      focus_key: 'exercise.plan.focus_strength_split',
      exercises: [
        { name_key: 'exercise.plan.ex.squat', sets: 4, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.bench_press', sets: 4, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.deadlift', sets: 3, reps: 8, duration: null },
        { name_key: 'exercise.plan.ex.pull_up', sets: 3, reps: 8, duration: null },
        { name_key: 'exercise.plan.ex.shoulder_press', sets: 3, reps: 10, duration: null },
      ],
    },
    improve_health: {
      title_key: 'exercise.plan.inter_ih_title',
      sessions: 4,
      focus_key: 'exercise.plan.focus_cardio_strength',
      exercises: [
        { name_key: 'exercise.plan.ex.run_20min', sets: null, reps: null, duration: 20 },
        { name_key: 'exercise.plan.ex.squat', sets: 3, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.push_up', sets: 3, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.plank', sets: 3, reps: null, duration: 45 },
        { name_key: 'exercise.plan.ex.stretch_full', sets: null, reps: null, duration: 10 },
      ],
    },
    maintain: {
      title_key: 'exercise.plan.inter_m_title',
      sessions: 3,
      focus_key: 'exercise.plan.focus_balance',
      exercises: [
        { name_key: 'exercise.plan.ex.run_20min', sets: null, reps: null, duration: 20 },
        { name_key: 'exercise.plan.ex.squat', sets: 3, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.push_up', sets: 3, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.yoga_basic', sets: null, reps: null, duration: 15 },
      ],
    },
  },
  advanced: {
    lose_weight: {
      title_key: 'exercise.plan.adv_lw_title',
      sessions: 6,
      focus_key: 'exercise.plan.focus_hiit_weights',
      exercises: [
        { name_key: 'exercise.plan.ex.hiit_30min', sets: null, reps: null, duration: 30 },
        { name_key: 'exercise.plan.ex.burpee', sets: 4, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.squat_jump', sets: 4, reps: 20, duration: null },
        { name_key: 'exercise.plan.ex.pull_up', sets: 4, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.plank', sets: 4, reps: null, duration: 90 },
      ],
    },
    gain_muscle: {
      title_key: 'exercise.plan.adv_gm_title',
      sessions: 5,
      focus_key: 'exercise.plan.focus_hypertrophy',
      exercises: [
        { name_key: 'exercise.plan.ex.squat', sets: 5, reps: 8, duration: null },
        { name_key: 'exercise.plan.ex.deadlift', sets: 4, reps: 6, duration: null },
        { name_key: 'exercise.plan.ex.bench_press', sets: 4, reps: 8, duration: null },
        { name_key: 'exercise.plan.ex.pull_up', sets: 4, reps: 10, duration: null },
        { name_key: 'exercise.plan.ex.shoulder_press', sets: 4, reps: 8, duration: null },
      ],
    },
    improve_health: {
      title_key: 'exercise.plan.adv_ih_title',
      sessions: 5,
      focus_key: 'exercise.plan.focus_cardio_strength',
      exercises: [
        { name_key: 'exercise.plan.ex.run_30min', sets: null, reps: null, duration: 30 },
        { name_key: 'exercise.plan.ex.squat', sets: 4, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.push_up', sets: 4, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.plank', sets: 3, reps: null, duration: 60 },
        { name_key: 'exercise.plan.ex.stretch_full', sets: null, reps: null, duration: 10 },
      ],
    },
    maintain: {
      title_key: 'exercise.plan.adv_m_title',
      sessions: 4,
      focus_key: 'exercise.plan.focus_performance',
      exercises: [
        { name_key: 'exercise.plan.ex.run_30min', sets: null, reps: null, duration: 30 },
        { name_key: 'exercise.plan.ex.squat', sets: 4, reps: 12, duration: null },
        { name_key: 'exercise.plan.ex.push_up', sets: 4, reps: 15, duration: null },
        { name_key: 'exercise.plan.ex.pull_up', sets: 3, reps: 10, duration: null },
      ],
    },
  },
}

/**
 * Analyzes logged exercises and returns a recovery nutrition guidance object.
 * @param {Array} logs - today's exercise_logs
 * @param {string} healthGoal
 * @returns {{ type, macroFocus, foods, hydration, timing }}
 */
export function getRecoveryGuidance(logs, healthGoal = 'improve_health') {
  if (!logs || logs.length === 0) return null

  const totalMinutes = logs.reduce((s, l) => s + (l.duration_minutes || 0), 0)

  // Classify dominant exercise type
  const typeCounts = { cardio: 0, strength: 0, flexibility: 0, sports: 0, other: 0 }
  logs.forEach(l => { if (typeCounts[l.exercise_type] !== undefined) typeCounts[l.exercise_type]++ })
  const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]

  // Cardio or sports = glycogen depletion focus; strength = muscle protein synthesis focus
  const isCardio = dominant === 'cardio' || dominant === 'sports'
  const isStrength = dominant === 'strength'
  const isLight = dominant === 'flexibility' || dominant === 'other'

  const needsElectrolytes = totalMinutes >= 45 && (isCardio || isStrength)

  if (isStrength) {
    return {
      type: 'strength',
      macroFocus: { protein_g: healthGoal === 'gain_muscle' ? '35–45' : '25–35', carbs_g: '30–50', fat_g: '10–15' },
      foods: ['Pechuga de pollo o pavo', 'Huevos o claras', 'Atún o salmón', 'Arroz integral o papa', 'Leche o yogur natural'],
      hydration: needsElectrolytes,
      timing: 'within_60min',
    }
  }

  if (isCardio) {
    return {
      type: 'cardio',
      macroFocus: { protein_g: '20–30', carbs_g: '45–65', fat_g: '10–15' },
      foods: ['Fruta (banano, mango, frutos rojos)', 'Avena o arroz', 'Yogur natural sin azúcar', 'Pollo o huevo', 'Agua con pizca de sal'],
      hydration: needsElectrolytes,
      timing: 'within_45min',
    }
  }

  // Light exercise (yoga, flexibility)
  return {
    type: 'light',
    macroFocus: { protein_g: '15–20', carbs_g: '20–35', fat_g: '10–20' },
    foods: ['Fruta de temporada', 'Nueces o aguacate', 'Ensalada con proteína ligera', 'Yogur o kéfir'],
    hydration: false,
    timing: 'within_2h',
  }
}

/**
 * Returns a personalized workout plan based on experience level and health goal.
 */
export function getWorkoutPlan(experienceLevel = 'beginner', healthGoal = 'improve_health') {
  return WORKOUT_PLANS[experienceLevel]?.[healthGoal]
    ?? WORKOUT_PLANS[experienceLevel]?.improve_health
    ?? WORKOUT_PLANS.beginner.improve_health
}

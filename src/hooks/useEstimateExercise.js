import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { estimateCaloriesBurned } from '../lib/exerciseUtils'

export function useEstimateExercise() {
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState(null)
  const [error, setError] = useState(null)

  async function estimateExercise({ exerciseName, durationMinutes, weightKg, experienceLevel, healthGoal }) {
    if (!exerciseName || !durationMinutes) return null
    setEstimating(true)
    setError(null)
    setEstimate(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('estimate-exercise', {
        body: { exerciseName, durationMinutes, weightKg, experienceLevel, healthGoal },
      })

      if (fnError) throw fnError
      if (!data || typeof data.calories_estimated !== 'number') throw new Error('Invalid response')

      setEstimate(data)
      return data
    } catch {
      // Fallback silencioso: usar tabla MET local
      const fallbackCals = estimateCaloriesBurned(exerciseName, durationMinutes, weightKg ?? 70)
      const fallbackEstimate = {
        calories_estimated: fallbackCals,
        intensity: 'moderate',
        description: null,
        tips: [],
        exercise_type_suggested: 'other',
        isFallback: true,
      }
      setEstimate(fallbackEstimate)
      return fallbackEstimate
    } finally {
      setEstimating(false)
    }
  }

  function clearEstimate() {
    setEstimate(null)
    setError(null)
  }

  return { estimating, estimate, error, estimateExercise, clearEstimate }
}

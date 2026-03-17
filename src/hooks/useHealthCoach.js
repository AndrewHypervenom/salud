import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useHealthCoach() {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyze = async ({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP }) => {
    setLoading(true)
    setError(null)

    const completedIds = new Set(habitLogs.map(l => l.habit_id))
    const completedHabits = habits.filter(h => completedIds.has(h.id))
    const pendingHabits = habits.filter(h => !completedIds.has(h.id))

    const payload = {
      profile,
      calTarget,
      todayCalories,
      foodLogs,
      habitsCompleted: completedHabits.length,
      habitsTotal: habits.length,
      habitNames: {
        completed: completedHabits.map(h => `${h.emoji} ${h.name}`),
        pending: pendingHabits.map(h => `${h.emoji} ${h.name}`),
      },
      lastBP: lastBP || null,
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('health-coach', {
        body: payload,
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setRecommendations(data)
    } catch (err) {
      setError(err.message || 'Error al generar recomendaciones')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setRecommendations(null)

  return { recommendations, loading, error, analyze, reset }
}

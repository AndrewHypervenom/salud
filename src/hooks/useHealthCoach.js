import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const todayDate = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

export function useHealthCoach(profileId) {
  const [todayAnalysis, setTodayAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Load today's saved analysis from DB
  useEffect(() => {
    if (!profileId) { setInitialLoading(false); return }

    supabase
      .from('daily_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .eq('analysis_date', todayDate())
      .maybeSingle()
      .then(({ data }) => {
        setTodayAnalysis(data || null)
        setInitialLoading(false)
      })
  }, [profileId])

  const analyze = useCallback(async ({ profile, calTarget, todayCalories, foodLogs, habits, habitLogs, lastBP }) => {
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

      // UPSERT to DB
      const record = {
        profile_id: profileId,
        analysis_date: todayDate(),
        total_calories: todayCalories,
        cal_target: calTarget,
        analysis_text: data.analysis,
        recommendations: data.recommendations,
        tomorrow_plan: data.tomorrow_plan,
        motivation: data.motivation,
        food_count: foodLogs.length,
        updated_at: new Date().toISOString(),
      }

      const { data: saved, error: dbError } = await supabase
        .from('daily_analyses')
        .upsert(record, { onConflict: 'profile_id,analysis_date' })
        .select()
        .single()

      if (dbError) throw dbError
      setTodayAnalysis(saved)
    } catch (err) {
      setError(err.message || 'Error al generar análisis')
    } finally {
      setLoading(false)
    }
  }, [profileId])

  return { todayAnalysis, loading, initialLoading, error, analyze }
}

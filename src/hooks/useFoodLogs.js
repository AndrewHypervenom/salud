import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function todayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useFoodLogs(profileId) {
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTodayLogs = useCallback(async () => {
    if (!profileId) { setTodayLogs([]); return }
    setLoading(true)
    setError(null)

    const { start, end } = todayRange()
    const { data, error: err } = await supabase
      .from('food_logs')
      .select('*')
      .eq('profile_id', profileId)
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: true })

    if (err) setError(err.message)
    else setTodayLogs(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    fetchTodayLogs()
  }, [fetchTodayLogs])

  const todayCalories = todayLogs.reduce((sum, log) => sum + (log.calories_estimated || 0), 0)

  const addFoodLog = async ({ meal_type, description, calories_estimated, image_url, notes, protein_g, carbs_g, fat_g, fiber_g }) => {
    const { data, error: err } = await supabase
      .from('food_logs')
      .insert([{ profile_id: profileId, meal_type, description, calories_estimated, image_url, notes, protein_g: protein_g ?? null, carbs_g: carbs_g ?? null, fat_g: fat_g ?? null, fiber_g: fiber_g ?? null }])
      .select()
      .single()
    if (err) throw err
    setTodayLogs(prev => [...prev, data].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at)))
    return data
  }

  const deleteFoodLog = async (id) => {
    const { error: err } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', id)
    if (err) throw err
    setTodayLogs(prev => prev.filter(l => l.id !== id))
  }

  return { todayLogs, loading, error, todayCalories, addFoodLog, deleteFoodLog, refetch: fetchTodayLogs }
}

export function useRecentFoodLogs(profileId, days = 7) {
  const [recentFoods, setRecentFoods] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!profileId) { setRecentFoods([]); return }
    setLoading(true)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('food_logs')
      .select('description')
      .eq('profile_id', profileId)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })
      .limit(100)
    if (data) {
      const freq = {}
      data.forEach(l => { if (l.description) freq[l.description] = (freq[l.description] || 0) + 1 })
      setRecentFoods(
        Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([description, count]) => ({ description, count }))
      )
    }
    setLoading(false)
  }, [profileId, days])

  useEffect(() => { fetch() }, [fetch])
  return { recentFoods, loading }
}

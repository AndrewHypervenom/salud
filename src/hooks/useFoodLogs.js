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

  const addFoodLog = async ({ meal_type, description, calories_estimated, image_url, notes }) => {
    const { data, error: err } = await supabase
      .from('food_logs')
      .insert([{ profile_id: profileId, meal_type, description, calories_estimated, image_url, notes }])
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

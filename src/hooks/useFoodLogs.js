import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function dateRange(date) {
  const d = date ?? new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useFoodLogs(profileId, selectedDate = null) {
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTodayLogs = useCallback(async () => {
    if (!profileId) { setTodayLogs([]); return }
    setLoading(true)
    setError(null)

    const { start, end } = dateRange(selectedDate)
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
  }, [profileId, selectedDate])

  useEffect(() => {
    fetchTodayLogs()
  }, [fetchTodayLogs])

  const todayCalories = todayLogs.reduce((sum, log) => sum + (log.calories_estimated || 0), 0)

  const addFoodLog = async ({ meal_type, description, calories_estimated, image_url, notes, protein_g, carbs_g, fat_g, fiber_g }) => {
    const now = new Date()
    const base = selectedDate ?? now
    const logged_at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString()
    const { data, error: err } = await supabase
      .from('food_logs')
      .insert([{ profile_id: profileId, meal_type, description, calories_estimated, image_url, notes, protein_g: protein_g ?? null, carbs_g: carbs_g ?? null, fat_g: fat_g ?? null, fiber_g: fiber_g ?? null, logged_at }])
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

export function useFoodLogsByDay(profileId, days = 60) {
  const [foodLogsByDay, setFoodLogsByDay] = useState({})
  const [rawLogs, setRawLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!profileId) { setFoodLogsByDay({}); setRawLogs([]); return }
    setLoading(true)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('food_logs')
      .select('logged_at, calories_estimated, description')
      .eq('profile_id', profileId)
      .gte('logged_at', since)
      .order('logged_at', { ascending: true })
    if (data) {
      setRawLogs(data)
      const byDay = {}
      for (const log of data) {
        const date = new Date(log.logged_at).toLocaleDateString('en-CA')
        if (!byDay[date]) byDay[date] = { totalCal: 0, logs: [] }
        byDay[date].totalCal += log.calories_estimated || 0
        byDay[date].logs.push(log)
      }
      setFoodLogsByDay(byDay)
    }
    setLoading(false)
  }, [profileId, days])

  useEffect(() => { fetch() }, [fetch])
  return { foodLogsByDay, rawLogs, loading }
}

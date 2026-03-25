import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function dateRange(date) {
  const d = date ?? new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useWaterLogs(profileId, waterGoalMl = 2000, selectedDate = null) {
  const [todayEntries, setTodayEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchToday = useCallback(async () => {
    if (!profileId) { setTodayEntries([]); return }
    setLoading(true)
    setError(null)
    const { start, end } = dateRange(selectedDate)
    const { data, error: err } = await supabase
      .from('water_logs')
      .select('*')
      .eq('profile_id', profileId)
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: false })
    if (err) setError(err.message)
    else setTodayEntries(data || [])
    setLoading(false)
  }, [profileId, selectedDate])

  useEffect(() => { fetchToday() }, [fetchToday])

  const todayTotal = todayEntries.reduce((sum, e) => sum + (e.amount_ml || 0), 0)
  const todayPercent = waterGoalMl > 0 ? Math.min((todayTotal / waterGoalMl) * 100, 100) : 0

  const addWater = async (amount_ml = 250) => {
    const now = new Date()
    const base = selectedDate ?? now
    const logged_at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString()
    const { data, error: err } = await supabase
      .from('water_logs')
      .insert([{ profile_id: profileId, amount_ml, logged_at }])
      .select()
      .single()
    if (err) throw err
    setTodayEntries(prev => [data, ...prev])
    return data
  }

  const deleteWater = async (id) => {
    const { error: err } = await supabase.from('water_logs').delete().eq('id', id)
    if (err) throw err
    setTodayEntries(prev => prev.filter(e => e.id !== id))
  }

  return { todayEntries, todayTotal, todayPercent, loading, error, addWater, deleteWater, refetch: fetchToday }
}

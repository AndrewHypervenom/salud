import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function todayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useWaterLogs(profileId, waterGoalMl = 2000) {
  const [todayEntries, setTodayEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchToday = useCallback(async () => {
    if (!profileId) { setTodayEntries([]); return }
    setLoading(true)
    setError(null)
    const { start, end } = todayRange()
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
  }, [profileId])

  useEffect(() => { fetchToday() }, [fetchToday])

  const todayTotal = todayEntries.reduce((sum, e) => sum + (e.amount_ml || 0), 0)
  const todayPercent = waterGoalMl > 0 ? Math.min((todayTotal / waterGoalMl) * 100, 100) : 0

  const addWater = async (amount_ml = 250) => {
    const { data, error: err } = await supabase
      .from('water_logs')
      .insert([{ profile_id: profileId, amount_ml }])
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

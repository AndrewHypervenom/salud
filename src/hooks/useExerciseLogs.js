import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function todayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useExerciseLogs(profileId) {
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTodayLogs = useCallback(async () => {
    if (!profileId) { setTodayLogs([]); return }
    setLoading(true)
    setError(null)

    const { start, end } = todayRange()
    const { data, error: err } = await supabase
      .from('exercise_logs')
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

  const todayCaloriesBurned = todayLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0)
  const todayMinutes = todayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0)

  const addExerciseLog = async (entry) => {
    const { data, error: err } = await supabase
      .from('exercise_logs')
      .insert([{ profile_id: profileId, ...entry }])
      .select()
      .single()
    if (err) throw err
    setTodayLogs(prev => [...prev, data].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at)))
    return data
  }

  const deleteExerciseLog = async (id) => {
    const { error: err } = await supabase
      .from('exercise_logs')
      .delete()
      .eq('id', id)
    if (err) throw err
    setTodayLogs(prev => prev.filter(l => l.id !== id))
  }

  return { todayLogs, loading, error, todayCaloriesBurned, todayMinutes, addExerciseLog, deleteExerciseLog, refetch: fetchTodayLogs }
}

export function useExerciseLogsByDay(profileId, days = 60) {
  const [exerciseLogsByDay, setExerciseLogsByDay] = useState({})
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!profileId) { setExerciseLogsByDay({}); return }
    setLoading(true)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('exercise_logs')
      .select('logged_at, calories_burned')
      .eq('profile_id', profileId)
      .gte('logged_at', since)
      .order('logged_at', { ascending: true })
    if (data) {
      const byDay = {}
      for (const log of data) {
        const date = new Date(log.logged_at).toLocaleDateString('en-CA')
        if (!byDay[date]) byDay[date] = { totalBurned: 0 }
        byDay[date].totalBurned += log.calories_burned || 0
      }
      setExerciseLogsByDay(byDay)
    }
    setLoading(false)
  }, [profileId, days])

  useEffect(() => { fetch() }, [fetch])
  return { exerciseLogsByDay, loading }
}

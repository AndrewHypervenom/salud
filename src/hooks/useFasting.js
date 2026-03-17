import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFasting(profileId) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSessions = useCallback(async () => {
    if (!profileId) { setSessions([]); return }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .order('start_time', { ascending: false })
      .limit(30)
    if (err) setError(err.message)
    else setSessions(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const activeSession = sessions.find(s => !s.end_time && !s.completed) || null

  const startFast = async (target_hours = 16) => {
    if (activeSession) throw new Error('Ya hay un ayuno activo')
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .insert([{ profile_id: profileId, start_time: new Date().toISOString(), target_hours }])
      .select()
      .single()
    if (err) throw err
    setSessions(prev => [data, ...prev])
    return data
  }

  const endFast = async (id) => {
    const now = new Date().toISOString()
    const session = sessions.find(s => s.id === id)
    if (!session) return
    const startMs = new Date(session.start_time).getTime()
    const endMs = new Date(now).getTime()
    const elapsedHours = (endMs - startMs) / (1000 * 60 * 60)
    const completed = elapsedHours >= session.target_hours

    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .update({ end_time: now, completed })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setSessions(prev => prev.map(s => s.id === id ? data : s))
    return data
  }

  const editTimes = async (id, start_time, end_time) => {
    const update = { start_time }
    if (end_time) {
      const elapsed = (new Date(end_time) - new Date(start_time)) / (1000 * 60 * 60)
      const session = sessions.find(s => s.id === id)
      update.end_time = end_time
      update.completed = elapsed >= (session?.target_hours || 16)
    }
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setSessions(prev => prev.map(s => s.id === id ? data : s))
    return data
  }

  const deleteSession = async (id) => {
    const { error: err } = await supabase.from('fasting_sessions').delete().eq('id', id)
    if (err) throw err
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const completedCount = sessions.filter(s => s.completed).length

  return { sessions, activeSession, completedCount, loading, error, startFast, endFast, editTimes, deleteSession, refetch: fetchSessions }
}

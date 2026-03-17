import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWeightLogs(profileId) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLogs = useCallback(async () => {
    if (!profileId) { setLogs([]); return }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('logged_date', { ascending: false })
      .limit(90)
    if (err) setError(err.message)
    else setLogs(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const addWeight = async (weight_kg, logged_date) => {
    const date = logged_date || new Date().toLocaleDateString('en-CA')
    const { data, error: err } = await supabase
      .from('weight_logs')
      .upsert([{ profile_id: profileId, weight_kg, logged_date: date }], { onConflict: 'profile_id,logged_date' })
      .select()
      .single()
    if (err) throw err
    setLogs(prev => {
      const filtered = prev.filter(l => l.logged_date !== date)
      return [data, ...filtered].sort((a, b) => b.logged_date.localeCompare(a.logged_date))
    })
    return data
  }

  const deleteWeight = async (id) => {
    const { error: err } = await supabase.from('weight_logs').delete().eq('id', id)
    if (err) throw err
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const latestWeight = logs[0]?.weight_kg ?? null

  return { logs, loading, error, latestWeight, addWeight, deleteWeight, refetch: fetchLogs }
}

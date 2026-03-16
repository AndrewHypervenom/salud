import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBloodPressure(profileId) {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchReadings = useCallback(async () => {
    if (!profileId) { setReadings([]); return }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('blood_pressure_readings')
      .select('*')
      .eq('profile_id', profileId)
      .order('measured_at', { ascending: false })
      .limit(50)
    if (err) setError(err.message)
    else setReadings(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    fetchReadings()
  }, [fetchReadings])

  const addReading = async (readingData) => {
    const { data, error: err } = await supabase
      .from('blood_pressure_readings')
      .insert([{ ...readingData, profile_id: profileId }])
      .select()
      .single()
    if (err) throw err
    setReadings(prev => [data, ...prev])
    return data
  }

  const deleteReading = async (id) => {
    const { error: err } = await supabase
      .from('blood_pressure_readings')
      .delete()
      .eq('id', id)
    if (err) throw err
    setReadings(prev => prev.filter(r => r.id !== id))
  }

  return { readings, loading, error, fetchReadings, addReading, deleteReading }
}

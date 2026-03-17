import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (err) setError(err.message)
    else setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const createProfile = async (profileData) => {
    const { data, error: err } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    if (err) throw err
    setProfiles(prev => [...prev, data])
    return data
  }

  const updateProfile = async (id, profileData) => {
    const { data, error: err } = await supabase
      .from('profiles')
      .update({ ...profileData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setProfiles(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  const deleteProfile = async (id) => {
    const { error: err } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    if (err) throw err
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  const findProfileByPhone = async (phone) => {
    const normalized = phone.replace(/\D/g, '')
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, name, access_code')
      .eq('phone_whatsapp', normalized)
      .limit(1)
      .maybeSingle()
    if (err) throw err
    return data
  }

  return { profiles, loading, error, fetchProfiles, createProfile, updateProfile, deleteProfile, findProfileByPhone }
}

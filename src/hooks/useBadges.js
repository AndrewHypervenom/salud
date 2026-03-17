import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const ALL_BADGES = [
  { key: 'first_log', emoji: '🍽️', label_es: 'Primera comida', label_en: 'First meal logged' },
  { key: 'streak_7', emoji: '🔥', label_es: 'Racha de 7 días', label_en: '7-day streak' },
  { key: 'streak_30', emoji: '💎', label_es: 'Racha de 30 días', label_en: '30-day streak' },
  { key: 'goal_reached', emoji: '🏆', label_es: 'Meta de peso alcanzada', label_en: 'Weight goal reached' },
  { key: 'hydrated_7', emoji: '💧', label_es: '7 días meta de agua', label_en: '7 days water goal' },
  { key: 'fast_master_10', emoji: '⚡', label_es: '10 ayunos completados', label_en: '10 fasts completed' },
  { key: 'food_tracker_30', emoji: '📅', label_es: '30 días registrando comidas', label_en: '30 days food tracking' },
  { key: 'bp_monitor_7', emoji: '❤️', label_es: '7 días monitoreando presión', label_en: '7 days BP monitoring' },
]

export function useBadges(profileId) {
  const [badges, setBadges] = useState([])
  const [newBadge, setNewBadge] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchBadges = useCallback(async () => {
    if (!profileId) { setBadges([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('profile_id', profileId)
    setBadges(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchBadges() }, [fetchBadges])

  const hasBadge = (key) => badges.some(b => b.badge_key === key)

  const checkAndUnlock = async (key, condition) => {
    if (!profileId || !condition || hasBadge(key)) return null
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert([{ profile_id: profileId, badge_key: key }])
        .select()
        .single()
      if (error) return null
      setBadges(prev => [...prev, data])
      const badgeDef = ALL_BADGES.find(b => b.key === key)
      if (badgeDef) setNewBadge(badgeDef)
      return data
    } catch {
      return null
    }
  }

  const clearNewBadge = () => setNewBadge(null)

  return { badges, newBadge, loading, hasBadge, checkAndUnlock, clearNewBadge, refetch: fetchBadges }
}

import { useState, useEffect, useCallback } from 'react'
import i18next from 'i18next'
import { supabase } from '../lib/supabase'

const todayDate = () => new Date().toLocaleDateString('en-CA')

const DEFAULT_HABIT_KEYS = [
  { nameKey: 'habits.default_medication', emoji: '💊', sort_order: 0 },
  { nameKey: 'habits.default_water',      emoji: '💧', sort_order: 1 },
  { nameKey: 'habits.default_walk',       emoji: '🚶', sort_order: 2 },
  { nameKey: 'habits.default_sleep',      emoji: '😴', sort_order: 3 },
  { nameKey: 'habits.default_log_meals',  emoji: '🍽️', sort_order: 4 },
]

// Mapa de todas las variantes conocidas (cualquier idioma) → clave i18n.
// Permite traducir visualmente sin modificar la BD.
const HABIT_NAME_TO_KEY = {
  // ES
  'Tomar medicamento':      'habits.default_medication',
  'Beber 8 vasos de agua':  'habits.default_water',
  'Caminar 30 minutos':     'habits.default_walk',
  'Dormir 7-8 horas':       'habits.default_sleep',
  'Registrar comidas':      'habits.default_log_meals',
  // EN
  'Take medication':        'habits.default_medication',
  'Drink 8 glasses of water': 'habits.default_water',
  'Walk 30 minutes':        'habits.default_walk',
  'Sleep 7-8 hours':        'habits.default_sleep',
  'Log meals':              'habits.default_log_meals',
}

// Devuelve el nombre del hábito traducido al idioma activo si es un hábito por defecto;
// de lo contrario devuelve el nombre original guardado en BD.
export function getHabitDisplayName(name, t) {
  const key = HABIT_NAME_TO_KEY[name]
  return key ? t(key) : name
}

export function useHabits(profileId) {
  const [habits, setHabits] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchHabits = useCallback(async () => {
    if (!profileId) { setHabits([]); setTodayLogs([]); return }
    setLoading(true)
    setError(null)

    const [habitsRes, logsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('*')
        .eq('profile_id', profileId)
        .eq('completed_date', todayDate()),
    ])

    if (habitsRes.error) setError(habitsRes.error.message)
    else setHabits(habitsRes.data || [])

    if (logsRes.error) setError(logsRes.error.message)
    else setTodayLogs(logsRes.data || [])

    setLoading(false)
  }, [profileId])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const toggleHabit = async (habitId) => {
    const today = todayDate()
    const existing = todayLogs.find(l => l.habit_id === habitId)

    if (existing) {
      const { error: err } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', existing.id)
      if (err) throw err
      setTodayLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data, error: err } = await supabase
        .from('habit_logs')
        .insert([{ habit_id: habitId, profile_id: profileId, completed_date: today }])
        .select()
        .single()
      if (err) throw err
      setTodayLogs(prev => [...prev, data])
    }
  }

  const addHabit = async (name, emoji = '✅') => {
    const sort_order = habits.length
    const { data, error: err } = await supabase
      .from('habits')
      .insert([{ profile_id: profileId, name, emoji, sort_order }])
      .select()
      .single()
    if (err) throw err
    setHabits(prev => [...prev, data])
    return data
  }

  const deleteHabit = async (id) => {
    const { error: err } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id)
    if (err) throw err
    setHabits(prev => prev.filter(h => h.id !== id))
    setTodayLogs(prev => prev.filter(l => l.habit_id !== id))
  }

  const seedDefaultHabits = async (pid) => {
    const targetId = pid || profileId
    const habits = DEFAULT_HABIT_KEYS.map(h => ({
      name: i18next.t(h.nameKey),
      emoji: h.emoji,
      sort_order: h.sort_order,
      profile_id: targetId,
    }))
    const { data, error: err } = await supabase
      .from('habits')
      .insert(habits)
      .select()
    if (err) throw err
    if (pid === profileId || !pid) setHabits(data || [])
    return data
  }

  return { habits, todayLogs, loading, error, toggleHabit, addHabit, deleteHabit, seedDefaultHabits, refetch: fetchHabits }
}

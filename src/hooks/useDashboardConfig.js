import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useProfileContext } from '../context/ProfileContext'

// ── Catálogo completo de widgets disponibles ──────────────────────────────────
export const WIDGET_CATALOG = [
  { id: 'calories',      label: 'widgets.calories',      size: 'full' },
  { id: 'quick_actions', label: 'widgets.quick_actions',  size: 'full' },
  { id: 'meals',         label: 'widgets.meals',          size: 'full' },
  { id: 'macros',        label: 'widgets.macros',         size: 'full' },
  { id: 'water',         label: 'widgets.water',          size: 'half' },
  { id: 'fasting',       label: 'widgets.fasting',        size: 'half' },
  { id: 'habits',        label: 'widgets.habits',         size: 'full' },
  { id: 'coach',         label: 'widgets.coach',          size: 'full' },
  { id: 'bp',            label: 'widgets.bp',             size: 'half' },
  { id: 'weight',        label: 'widgets.weight',         size: 'half' },
  { id: 'doctor',        label: 'widgets.doctor',         size: 'half' },
  { id: 'streak',        label: 'widgets.streak',         size: 'half' },
  { id: 'craving',       label: 'widgets.craving',        size: 'full' },
]

// ── Catálogo completo de rutas personalizables en nav ─────────────────────────
export const NAV_CATALOG = [
  { key: 'food',             to: '/food',             label: 'nav.food' },
  { key: 'habits',           to: '/habits',           label: 'nav.habits' },
  { key: 'blood-pressure',   to: '/blood-pressure',   label: 'nav.blood_pressure' },
  { key: 'progress',         to: '/progress',         label: 'nav.progress' },
  { key: 'water',            to: '/water',            label: 'nav.water' },
  { key: 'weight',           to: '/weight',           label: 'nav.weight' },
  { key: 'fasting',          to: '/fasting',          label: 'nav.fasting' },
  { key: 'recipes',          to: '/recipes',          label: 'nav.recipes' },
  { key: 'food-search',      to: '/food-search',      label: 'nav.food_search' },
  { key: 'badges',           to: '/badges',           label: 'nav.badges' },
  { key: 'calories',         to: '/calories',         label: 'nav.calories' },
  { key: 'diet',             to: '/diet',             label: 'nav.diet' },
  { key: 'exercise',         to: '/exercise',         label: 'nav.exercise' },
  { key: 'doctor-questions', to: '/doctor-questions', label: 'nav.doctor_questions' },
  { key: 'profiles',         to: '/profiles',         label: 'nav.profiles' },
]

const DEFAULT_WIDGETS  = ['calories', 'quick_actions', 'meals', 'macros', 'craving', 'water', 'fasting', 'habits', 'coach', 'bp', 'weight', 'doctor']
const DEFAULT_SHORTCUTS = ['habits', 'food', 'blood-pressure']
const STORAGE_W = 'dashboard_widget_order_v2'
const STORAGE_N = 'nav_shortcuts_v2'

function mergeWithCatalog(raw) {
  const known = new Set(raw.visible.concat(raw.hidden))
  const newWidgets = WIDGET_CATALOG.map(w => w.id).filter(id => !known.has(id))
  return { visible: raw.visible, hidden: [...raw.hidden, ...newWidgets] }
}

function loadWidgets() {
  try {
    const raw = localStorage.getItem(STORAGE_W)
    if (raw) return mergeWithCatalog(JSON.parse(raw))
  } catch {}
  const allIds = WIDGET_CATALOG.map(w => w.id)
  return {
    visible: DEFAULT_WIDGETS.filter(id => allIds.includes(id)),
    hidden: allIds.filter(id => !DEFAULT_WIDGETS.includes(id)),
  }
}

function loadShortcuts() {
  try {
    const raw = localStorage.getItem(STORAGE_N)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_SHORTCUTS
}

async function saveToSupabase(profileId, config, shortcuts) {
  await supabase
    .from('profiles')
    .update({ preferences: { widgetOrder: config, navShortcuts: shortcuts } })
    .eq('id', profileId)
}

export function useDashboardConfig() {
  const { activeProfileId } = useProfileContext()
  const [config, setConfig] = useState(() => loadWidgets())
  const [shortcuts, setShortcutsState] = useState(() => loadShortcuts())
  const [configLoading, setConfigLoading] = useState(false)
  const saveTimerRef = useRef(null)

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_W, JSON.stringify(config))
  }, [config])

  useEffect(() => {
    localStorage.setItem(STORAGE_N, JSON.stringify(shortcuts))
  }, [shortcuts])

  // Load from Supabase when profile changes
  useEffect(() => {
    if (!activeProfileId) return
    setConfigLoading(true)
    supabase
      .from('profiles')
      .select('preferences')
      .eq('id', activeProfileId)
      .single()
      .then(({ data }) => {
        const prefs = data?.preferences || {}
        if (prefs.widgetOrder) {
          const merged = mergeWithCatalog(prefs.widgetOrder)
          setConfig(merged)
          localStorage.setItem(STORAGE_W, JSON.stringify(merged))
        } else {
          // Primera vez: subir config local a Supabase
          saveToSupabase(activeProfileId, config, shortcuts)
        }
        if (prefs.navShortcuts) {
          setShortcutsState(prefs.navShortcuts)
          localStorage.setItem(STORAGE_N, JSON.stringify(prefs.navShortcuts))
        }
        setConfigLoading(false)
      })
  }, [activeProfileId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced write to Supabase (1 second after last change)
  useEffect(() => {
    if (!activeProfileId || configLoading) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToSupabase(activeProfileId, config, shortcuts)
    }, 1000)
    return () => clearTimeout(saveTimerRef.current)
  }, [config, shortcuts, activeProfileId, configLoading])

  // Move widget up or down
  const moveWidget = useCallback((id, dir) => {
    setConfig(prev => {
      const arr = [...prev.visible]
      const i = arr.indexOf(id)
      if (i === -1) return prev
      if (dir === 'up' && i === 0) return prev
      if (dir === 'down' && i === arr.length - 1) return prev
      const swap = dir === 'up' ? i - 1 : i + 1
      ;[arr[i], arr[swap]] = [arr[swap], arr[i]]
      return { ...prev, visible: arr }
    })
  }, [])

  // Drag & drop reorder
  const reorderWidgets = useCallback((fromId, toId) => {
    if (fromId === toId) return
    setConfig(prev => {
      const arr = [...prev.visible]
      const from = arr.indexOf(fromId)
      const to = arr.indexOf(toId)
      if (from === -1 || to === -1) return prev
      arr.splice(from, 1)
      arr.splice(to, 0, fromId)
      return { ...prev, visible: arr }
    })
  }, [])

  // Hide widget (move to hidden)
  const hideWidget = useCallback((id) => {
    setConfig(prev => ({
      visible: prev.visible.filter(w => w !== id),
      hidden: [...prev.hidden, id],
    }))
  }, [])

  // Show widget (move to visible, append at end)
  const showWidget = useCallback((id) => {
    setConfig(prev => ({
      visible: [...prev.visible, id],
      hidden: prev.hidden.filter(w => w !== id),
    }))
  }, [])

  // Update nav shortcuts (3-slot array)
  const setShortcuts = useCallback((newShortcuts) => {
    setShortcutsState(newShortcuts.slice(0, 3))
  }, [])

  const setShortcutAt = useCallback((index, key) => {
    setShortcutsState(prev => {
      const next = [...prev]
      next[index] = key
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    const allIds = WIDGET_CATALOG.map(w => w.id)
    setConfig({
      visible: DEFAULT_WIDGETS.filter(id => allIds.includes(id)),
      hidden: allIds.filter(id => !DEFAULT_WIDGETS.includes(id)),
    })
    setShortcutsState(DEFAULT_SHORTCUTS)
  }, [])

  return {
    visibleWidgets: config.visible,
    hiddenWidgets: config.hidden,
    shortcuts,
    configLoading,
    moveWidget,
    reorderWidgets,
    hideWidget,
    showWidget,
    setShortcuts,
    setShortcutAt,
    resetAll,
  }
}

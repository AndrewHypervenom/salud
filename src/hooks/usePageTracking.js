import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TRACKED_PAGES = [
  '/dashboard', '/food', '/food-search', '/water', '/exercise',
  '/weight', '/habits', '/fasting', '/blood-pressure', '/progress',
  '/calories', '/diet', '/recipes', '/doctor-questions',
  '/badges', '/fitness-profile', '/profiles',
]

export function usePageTracking(profileId) {
  const location = useLocation()
  const timer = useRef(null)

  useEffect(() => {
    if (!profileId) return
    const page = TRACKED_PAGES.find(p => location.pathname.startsWith(p))
    if (!page) return

    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      supabase.from('page_views').insert({ profile_id: profileId, page })
    }, 1000)

    return () => clearTimeout(timer.current)
  }, [location.pathname, profileId])
}

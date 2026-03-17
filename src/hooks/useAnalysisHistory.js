import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAnalysisHistory(profileId, limit = 90) {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profileId) { setAnalyses([]); return }
    setLoading(true)

    supabase
      .from('daily_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .order('analysis_date', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setAnalyses(data || [])
        setLoading(false)
      })
  }, [profileId])

  // Group by ISO week (Mon-Sun)
  const byWeek = analyses.reduce((acc, a) => {
    const date = new Date(a.analysis_date + 'T12:00:00')
    const day = date.getDay() // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day)
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMon)
    const key = monday.toLocaleDateString('en-CA') // YYYY-MM-DD of that Monday
    if (!acc[key]) acc[key] = { monday, entries: [] }
    acc[key].entries.push(a)
    return acc
  }, {})

  const weeks = Object.values(byWeek).sort((a, b) => b.monday - a.monday)

  // Group by month
  const byMonth = analyses.reduce((acc, a) => {
    const key = a.analysis_date.slice(0, 7) // YYYY-MM
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const months = Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, entries]) => ({ key, entries }))

  return { analyses, loading, weeks, months }
}

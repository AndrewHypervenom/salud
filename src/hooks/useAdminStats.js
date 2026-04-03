import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function toYearMonth(dateStr) {
  if (!dateStr) return null
  return dateStr.slice(0, 7) // 'YYYY-MM'
}

export function useAdminStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // All queries in parallel
        const [
          profilesResult,
          loginLogsResult,
          foodResult,
          exerciseResult,
          waterResult,
          weightResult,
          habitResult,
          fastingResult,
          bpResult,
        ] = await Promise.all([
          supabase.from('profiles').select('id, name, phone_whatsapp, health_goal, created_at').order('created_at', { ascending: true }),
          supabase.from('login_logs').select('profile_id, logged_at').order('logged_at', { ascending: false }),
          supabase.from('food_logs').select('profile_id, logged_at'),
          supabase.from('exercise_logs').select('profile_id, logged_at'),
          supabase.from('water_logs').select('profile_id, logged_at'),
          supabase.from('weight_logs').select('profile_id, logged_date'),
          supabase.from('habit_logs').select('profile_id, completed_date'),
          supabase.from('fasting_sessions').select('profile_id, start_time'),
          supabase.from('blood_pressure_readings').select('profile_id, measured_at'),
        ])

        if (cancelled) return

        const profiles = profilesResult.data || []
        const loginLogs = loginLogsResult.data || []

        // Feature log rows with normalized date field
        const featureLogs = [
          { key: 'food',     rows: foodResult.data || [],     dateField: 'logged_at' },
          { key: 'exercise', rows: exerciseResult.data || [], dateField: 'logged_at' },
          { key: 'water',    rows: waterResult.data || [],    dateField: 'logged_at' },
          { key: 'weight',   rows: weightResult.data || [],   dateField: 'logged_date' },
          { key: 'habits',   rows: habitResult.data || [],    dateField: 'completed_date' },
          { key: 'fasting',  rows: fastingResult.data || [],  dateField: 'start_time' },
          { key: 'bp',       rows: bpResult.data || [],       dateField: 'measured_at' },
        ]

        // Total counts by feature (global)
        const totalRecordsByFeature = {}
        for (const { key, rows } of featureLogs) {
          totalRecordsByFeature[key] = rows.length
        }

        // Per-user aggregation: total logs + last activity
        const userStats = {}
        for (const p of profiles) {
          userStats[p.id] = { totalLogs: 0, lastActivity: null }
        }

        for (const { rows, dateField } of featureLogs) {
          for (const row of rows) {
            if (!userStats[row.profile_id]) continue
            userStats[row.profile_id].totalLogs++
            const d = row[dateField]
            if (d && (!userStats[row.profile_id].lastActivity || d > userStats[row.profile_id].lastActivity)) {
              userStats[row.profile_id].lastActivity = d
            }
          }
        }

        // Per-user login stats (last login + login count)
        const userLoginStats = {}
        for (const log of loginLogs) {
          if (!userLoginStats[log.profile_id]) {
            userLoginStats[log.profile_id] = { count: 0, lastLogin: null }
          }
          userLoginStats[log.profile_id].count++
          if (!userLoginStats[log.profile_id].lastLogin || log.logged_at > userLoginStats[log.profile_id].lastLogin) {
            userLoginStats[log.profile_id].lastLogin = log.logged_at
          }
        }

        // Build ranking sorted by totalLogs desc
        const ranking = profiles.map(p => ({
          profileId: p.id,
          name: p.name,
          phone: p.phone_whatsapp,
          healthGoal: p.health_goal,
          createdAt: p.created_at,
          totalLogs: userStats[p.id]?.totalLogs ?? 0,
          lastActivity: userStats[p.id]?.lastActivity ?? null,
          lastLogin: userLoginStats[p.id]?.lastLogin ?? null,
          loginCount: userLoginStats[p.id]?.count ?? 0,
        })).sort((a, b) => b.totalLogs - a.totalLogs)

        // User growth by month
        const growthMap = {}
        for (const p of profiles) {
          const m = toYearMonth(p.created_at)
          if (m) growthMap[m] = (growthMap[m] || 0) + 1
        }
        const userGrowthByMonth = Object.entries(growthMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }))

        // Total logins
        const totalLogins = loginLogs.length

        if (!cancelled) {
          setData({
            totalUsers: profiles.length,
            totalLogins,
            totalRecordsByFeature,
            ranking,
            userGrowthByMonth,
          })
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}

export async function fetchUserDetail(profileId) {
  const [food, exercise, water, weight, habits, fasting, bp, badges] = await Promise.all([
    supabase.from('food_logs').select('logged_at, meal_type, description, calories_estimated').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(20),
    supabase.from('exercise_logs').select('logged_at, exercise_type, name, duration_minutes, calories_burned').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(15),
    supabase.from('water_logs').select('logged_at, amount_ml').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(15),
    supabase.from('weight_logs').select('logged_date, weight_kg').eq('profile_id', profileId).order('logged_date', { ascending: false }).limit(10),
    supabase.from('habit_logs').select('completed_date').eq('profile_id', profileId).order('completed_date', { ascending: false }).limit(15),
    supabase.from('fasting_sessions').select('start_time, end_time, target_hours, completed').eq('profile_id', profileId).order('start_time', { ascending: false }).limit(10),
    supabase.from('blood_pressure_readings').select('measured_at, systolic, diastolic, pulse').eq('profile_id', profileId).order('measured_at', { ascending: false }).limit(10),
    supabase.from('badges').select('badge_key, unlocked_at').eq('profile_id', profileId).order('unlocked_at', { ascending: false }),
  ])

  return {
    food: food.data || [],
    exercise: exercise.data || [],
    water: water.data || [],
    weight: weight.data || [],
    habits: habits.data || [],
    fasting: fasting.data || [],
    bp: bp.data || [],
    badges: badges.data || [],
  }
}

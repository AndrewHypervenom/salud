import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function toYearMonth(dateStr) {
  if (!dateStr) return null
  return dateStr.slice(0, 7)
}

export function useAdminStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
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
          badgesResult,
          analysesResult,
          pageViewsResult,
        ] = await Promise.all([
          supabase.from('profiles').select('id, name, phone_whatsapp, health_goal, age, sex, weight_kg, height_cm, activity, created_at').order('created_at', { ascending: true }),
          supabase.from('login_logs').select('profile_id, logged_at, source').order('logged_at', { ascending: false }),
          supabase.from('food_logs').select('profile_id, logged_at, calories_estimated'),
          supabase.from('exercise_logs').select('profile_id, logged_at, duration_minutes, calories_burned'),
          supabase.from('water_logs').select('profile_id, logged_at, amount_ml'),
          supabase.from('weight_logs').select('profile_id, logged_date, weight_kg'),
          supabase.from('habit_logs').select('profile_id, completed_date'),
          supabase.from('fasting_sessions').select('profile_id, start_time, completed'),
          supabase.from('blood_pressure_readings').select('profile_id, measured_at'),
          supabase.from('badges').select('profile_id, badge_key, unlocked_at'),
          supabase.from('daily_analyses').select('profile_id, analysis_date').order('analysis_date', { ascending: false }),
          supabase.from('page_views').select('profile_id, page, visited_at').gte('visited_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        ])

        if (cancelled) return

        const profiles = profilesResult.data || []
        const loginLogs = loginLogsResult.data || []

        const featureLogs = [
          { key: 'food',     rows: foodResult.data || [],     dateField: 'logged_at' },
          { key: 'exercise', rows: exerciseResult.data || [], dateField: 'logged_at' },
          { key: 'water',    rows: waterResult.data || [],    dateField: 'logged_at' },
          { key: 'weight',   rows: weightResult.data || [],   dateField: 'logged_date' },
          { key: 'habits',   rows: habitResult.data || [],    dateField: 'completed_date' },
          { key: 'fasting',  rows: fastingResult.data || [],  dateField: 'start_time' },
          { key: 'bp',       rows: bpResult.data || [],       dateField: 'measured_at' },
        ]

        const totalRecordsByFeature = {}
        for (const { key, rows } of featureLogs) {
          totalRecordsByFeature[key] = rows.length
        }

        // Adopción: usuarios únicos que han usado cada feature
        const adoptionByFeature = {}
        for (const { key, rows } of featureLogs) {
          const uniqueUsers = new Set(rows.map(r => r.profile_id))
          adoptionByFeature[key] = uniqueUsers.size
        }

        // Tendencia: registros últimos 7d vs 7d anteriores
        const nowTs = Date.now()
        const d7 = new Date(nowTs - 7 * 86400000)
        const d14 = new Date(nowTs - 14 * 86400000)

        const trend7ByFeature = {}
        for (const { key, rows, dateField } of featureLogs) {
          const last7 = rows.filter(r => r[dateField] && new Date(r[dateField]) >= d7).length
          const prev7 = rows.filter(r => {
            const d = r[dateField] ? new Date(r[dateField]) : null
            return d && d >= d14 && d < d7
          }).length
          trend7ByFeature[key] = last7 - prev7
        }

        // Page views últimos 30 días
        const pageViewRows = pageViewsResult.data || []
        const pageViewsLast30 = {}
        const pageViewsUniqueUsers = {}
        for (const pv of pageViewRows) {
          pageViewsLast30[pv.page] = (pageViewsLast30[pv.page] || 0) + 1
          if (!pageViewsUniqueUsers[pv.page]) pageViewsUniqueUsers[pv.page] = new Set()
          pageViewsUniqueUsers[pv.page].add(pv.profile_id)
        }
        const pageViewsUniqueCount = {}
        for (const [page, set] of Object.entries(pageViewsUniqueUsers)) {
          pageViewsUniqueCount[page] = set.size
        }

        // Per-user stats
        const userStats = {}
        for (const p of profiles) {
          userStats[p.id] = {
            totalLogs: 0, lastActivity: null,
            byFeature: { food: 0, exercise: 0, water: 0, weight: 0, habits: 0, fasting: 0, bp: 0 },
            totalCalories: 0, totalExerciseMin: 0, totalWaterMl: 0,
          }
        }

        for (const { key, rows, dateField } of featureLogs) {
          for (const row of rows) {
            const us = userStats[row.profile_id]
            if (!us) continue
            us.totalLogs++
            us.byFeature[key] = (us.byFeature[key] || 0) + 1
            const d = row[dateField]
            if (d && (!us.lastActivity || d > us.lastActivity)) us.lastActivity = d
          }
        }

        // Extra aggregates
        for (const row of (foodResult.data || [])) {
          if (userStats[row.profile_id] && row.calories_estimated) {
            userStats[row.profile_id].totalCalories += row.calories_estimated
          }
        }
        for (const row of (exerciseResult.data || [])) {
          if (userStats[row.profile_id] && row.duration_minutes) {
            userStats[row.profile_id].totalExerciseMin += row.duration_minutes
          }
        }
        for (const row of (waterResult.data || [])) {
          if (userStats[row.profile_id] && row.amount_ml) {
            userStats[row.profile_id].totalWaterMl += row.amount_ml
          }
        }

        // Badges per user
        const userBadges = {}
        for (const b of (badgesResult.data || [])) {
          userBadges[b.profile_id] = (userBadges[b.profile_id] || 0) + 1
        }

        // AI analyses per user
        const userAnalyses = {}
        for (const a of (analysesResult.data || [])) {
          if (!userAnalyses[a.profile_id]) userAnalyses[a.profile_id] = { count: 0, last: a.analysis_date }
          userAnalyses[a.profile_id].count++
        }

        // Login stats per user
        const userLoginStats = {}
        for (const log of loginLogs) {
          if (!userLoginStats[log.profile_id]) {
            userLoginStats[log.profile_id] = { count: 0, lastLogin: null, firstLogin: null }
          }
          userLoginStats[log.profile_id].count++
          if (!userLoginStats[log.profile_id].lastLogin || log.logged_at > userLoginStats[log.profile_id].lastLogin) {
            userLoginStats[log.profile_id].lastLogin = log.logged_at
          }
          if (!userLoginStats[log.profile_id].firstLogin || log.logged_at < userLoginStats[log.profile_id].firstLogin) {
            userLoginStats[log.profile_id].firstLogin = log.logged_at
          }
        }

        // Activity status: active = last activity within 7 days
        const now = new Date()
        const sevenDays = 7 * 24 * 3600 * 1000
        const thirtyDays = 30 * 24 * 3600 * 1000

        const ranking = profiles.map(p => {
          const us = userStats[p.id] || {}
          const ls = userLoginStats[p.id] || {}
          const lastAct = us.lastActivity ? new Date(us.lastActivity) : null
          const daysSinceActivity = lastAct ? Math.floor((now - lastAct) / (24 * 3600 * 1000)) : null
          const status =
            !lastAct ? 'inactive'
            : (now - lastAct) < sevenDays ? 'active'
            : (now - lastAct) < thirtyDays ? 'recent'
            : 'inactive'

          return {
            profileId: p.id,
            name: p.name,
            phone: p.phone_whatsapp,
            healthGoal: p.health_goal,
            age: p.age,
            sex: p.sex,
            weightKg: p.weight_kg,
            heightCm: p.height_cm,
            activity: p.activity,
            createdAt: p.created_at,
            totalLogs: us.totalLogs ?? 0,
            byFeature: us.byFeature ?? {},
            lastActivity: us.lastActivity ?? null,
            daysSinceActivity,
            status,
            totalCalories: Math.round(us.totalCalories || 0),
            totalExerciseMin: us.totalExerciseMin || 0,
            totalWaterMl: us.totalWaterMl || 0,
            badgeCount: userBadges[p.id] || 0,
            analysisCount: userAnalyses[p.id]?.count || 0,
            lastLogin: ls.lastLogin ?? null,
            firstLogin: ls.firstLogin ?? null,
            loginCount: ls.count ?? 0,
          }
        }).sort((a, b) => b.totalLogs - a.totalLogs)

        // Growth by month
        const growthMap = {}
        for (const p of profiles) {
          const m = toYearMonth(p.created_at)
          if (m) growthMap[m] = (growthMap[m] || 0) + 1
        }
        const userGrowthByMonth = Object.entries(growthMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }))

        // Active users last 7 / 30 days
        const activeUsers7 = ranking.filter(u => u.status === 'active').length
        const activeUsers30 = ranking.filter(u => u.status === 'active' || u.status === 'recent').length
        const totalLogins = loginLogs.length

        if (!cancelled) {
          setData({
            totalUsers: profiles.length,
            activeUsers7,
            activeUsers30,
            totalLogins,
            totalRecordsByFeature,
            adoptionByFeature,
            trend7ByFeature,
            pageViewsLast30,
            pageViewsUniqueCount,
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
  const [food, exercise, water, weight, habits, fasting, bp, badges, loginLogs, analyses] = await Promise.all([
    supabase.from('food_logs').select('logged_at, meal_type, description, calories_estimated, protein_g, carbs_g, fat_g').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(30),
    supabase.from('exercise_logs').select('logged_at, exercise_type, name, duration_minutes, calories_burned, sets, reps').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(20),
    supabase.from('water_logs').select('logged_at, amount_ml').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(20),
    supabase.from('weight_logs').select('logged_date, weight_kg').eq('profile_id', profileId).order('logged_date', { ascending: false }).limit(15),
    supabase.from('habit_logs').select('completed_date').eq('profile_id', profileId).order('completed_date', { ascending: false }).limit(30),
    supabase.from('fasting_sessions').select('start_time, end_time, target_hours, completed').eq('profile_id', profileId).order('start_time', { ascending: false }).limit(10),
    supabase.from('blood_pressure_readings').select('measured_at, systolic, diastolic, pulse').eq('profile_id', profileId).order('measured_at', { ascending: false }).limit(10),
    supabase.from('badges').select('badge_key, unlocked_at').eq('profile_id', profileId).order('unlocked_at', { ascending: false }),
    supabase.from('login_logs').select('logged_at, source').eq('profile_id', profileId).order('logged_at', { ascending: false }).limit(20),
    supabase.from('daily_analyses').select('analysis_date, total_calories, cal_target, motivation').eq('profile_id', profileId).order('analysis_date', { ascending: false }).limit(7),
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
    loginLogs: loginLogs.data || [],
    analyses: analyses.data || [],
  }
}

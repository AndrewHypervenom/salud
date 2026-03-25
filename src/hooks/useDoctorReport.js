import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calcBMR, calcTDEE, calcCalorieTargetFromProfile } from '../lib/formulas'

export function useDoctorReport(profileId) {
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)

  const generateReport = useCallback(async ({
    profile,
    foodLogsByDay,
    weightLogs,
    bpReadings,
    habits,
  }) => {
    if (!profileId || !profile) return
    setGenerating(true)
    setError(null)

    try {
      // --- calTarget ---
      const bmr = calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex)
      const tdee = calcTDEE(bmr, profile.activity)
      const calTarget = calcCalorieTargetFromProfile(profile, tdee)

      // --- Nutrición: promedios 7d y 30d ---
      const today = new Date()
      const allDays = Object.entries(foodLogsByDay || {})

      const days7 = allDays.filter(([d]) => {
        const diff = (today - new Date(d + 'T12:00:00')) / 86400000
        return diff <= 7
      })
      const days30 = allDays.filter(([d]) => {
        const diff = (today - new Date(d + 'T12:00:00')) / 86400000
        return diff <= 30
      })

      const avg7d = days7.length > 0
        ? Math.round(days7.reduce((s, [, v]) => s + (v.totalCal ?? 0), 0) / days7.length)
        : 0
      const avg30d = days30.length > 0
        ? Math.round(days30.reduce((s, [, v]) => s + (v.totalCal ?? 0), 0) / days30.length)
        : 0

      // --- Peso ---
      const sortedW = [...(weightLogs || [])].sort((a, b) => b.logged_date?.localeCompare(a.logged_date))
      const currentW = sortedW[0]?.weight_kg ?? profile.weight_kg
      const oldestW = sortedW[sortedW.length - 1]?.weight_kg ?? currentW
      const trendKg = sortedW.length >= 2
        ? Math.round((currentW - oldestW) * 10) / 10
        : 0

      // --- Presión arterial (últimas 5 lecturas) ---
      const lastBPs = (bpReadings || []).slice(0, 5).map(r => ({
        systolic: r.systolic,
        diastolic: r.diastolic,
        measured_at: (r.measured_at ?? '').split('T')[0],
      }))
      const avgSys = lastBPs.length > 0
        ? Math.round(lastBPs.reduce((s, r) => s + r.systolic, 0) / lastBPs.length)
        : null
      const avgDia = lastBPs.length > 0
        ? Math.round(lastBPs.reduce((s, r) => s + r.diastolic, 0) / lastBPs.length)
        : null

      // --- Ejercicio (últimos 14 días — query directa para tipos y minutos) ---
      const since14 = new Date(Date.now() - 14 * 86400000).toISOString()
      const { data: exerciseDetails } = await supabase
        .from('exercise_logs')
        .select('exercise_type, name, duration_minutes, logged_at')
        .eq('profile_id', profileId)
        .gte('logged_at', since14)

      const exerciseTypes = [...new Set(
        (exerciseDetails || []).map(e => e.name || e.exercise_type).filter(Boolean)
      )].slice(0, 5)
      const totalMinutes14d = (exerciseDetails || [])
        .reduce((s, e) => s + (e.duration_minutes || 0), 0)
      const activeDates = new Set(
        (exerciseDetails || []).map(e => (e.logged_at ?? '').split('T')[0]).filter(Boolean)
      )
      const daysActive14d = activeDates.size

      // --- Hábitos: cumplimiento últimos 30 días ---
      const since30 = new Date(Date.now() - 30 * 86400000).toLocaleDateString('en-CA')
      const { data: habitLogs30d } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_date')
        .eq('profile_id', profileId)
        .gte('completed_date', since30)

      const activeHabits = (habits || []).filter(h => h.is_active !== false)
      const completionPct = activeHabits.length > 0 && habitLogs30d?.length > 0
        ? Math.min(100, Math.round((habitLogs30d.length / (activeHabits.length * 30)) * 100))
        : 0

      const habitLogsById = {}
      for (const l of (habitLogs30d || [])) {
        habitLogsById[l.habit_id] = (habitLogsById[l.habit_id] || 0) + 1
      }
      const lowCompliance = activeHabits
        .filter(h => (habitLogsById[h.id] || 0) < 9) // menos del 30% de 30 días
        .map(h => h.name)

      // --- Payload para la Edge Function ---
      const payload = {
        mode: 'doctor_report',
        profile,
        calTarget,
        nutrition: {
          avg7d_calories: avg7d,
          avg30d_calories: avg30d,
          days_logged_7d: days7.length,
          days_logged_30d: days30.length,
        },
        weight: {
          current_kg: currentW,
          oldest_kg: oldestW,
          readings_count: sortedW.length,
          trend_kg: trendKg,
        },
        bloodPressure: {
          last_readings: lastBPs,
          avg_systolic: avgSys,
          avg_diastolic: avgDia,
        },
        exercise: {
          days_active_14d: daysActive14d,
          types: exerciseTypes,
          total_minutes_14d: totalMinutes14d,
        },
        habits: {
          completion_pct_30d: completionPct,
          habit_names: activeHabits.map(h => h.name),
          low_compliance: lowCompliance,
        },
      }

      // --- Llamar Edge Function ---
      const { data, error: fnError } = await supabase.functions.invoke('health-coach', {
        body: payload,
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      // --- Reemplazar preguntas custom del perfil con las generadas por IA ---
      await supabase
        .from('doctor_questions')
        .delete()
        .eq('profile_id', profileId)
        .is('question_key', null)

      const newRows = [
        ...(data.questions_medicine || []).map((q, i) => ({
          profile_id: profileId,
          question_key: null,
          custom_text: q,
          is_checked: false,
          sort_order: i,
          category: 'medicine',
        })),
        ...(data.questions_nutrition || []).map((q, i) => ({
          profile_id: profileId,
          question_key: null,
          custom_text: q,
          is_checked: false,
          sort_order: 100 + i,
          category: 'nutrition',
        })),
      ]

      if (newRows.length > 0) {
        await supabase.from('doctor_questions').insert(newRows)
      }

      setReportData({
        questions_medicine: data.questions_medicine || [],
        questions_nutrition: data.questions_nutrition || [],
        summary_medicine: data.summary_medicine || '',
        summary_nutrition: data.summary_nutrition || '',
        attention_areas: data.attention_areas || [],
        generatedAt: new Date().toISOString(),
        calTarget,
        nutrition: payload.nutrition,
        weight: payload.weight,
        bloodPressure: { ...payload.bloodPressure, readings: lastBPs },
        exercise: payload.exercise,
        habits: payload.habits,
      })

    } catch (err) {
      setError(err.message || 'Error generando informe')
    } finally {
      setGenerating(false)
    }
  }, [profileId])

  return { generating, reportData, error, generateReport }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const PREDEFINED_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']

export function useDoctorQuestions(profileId) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const seeding = useRef(false) // prevent concurrent seed attempts

  const seedPredefined = async () => {
    if (seeding.current) return
    seeding.current = true

    const rows = PREDEFINED_KEYS.map((key, i) => ({
      profile_id: null,
      question_key: key,
      custom_text: null,
      is_checked: false,
      sort_order: i,
    }))

    // Plain insert — if rows already exist Supabase returns an error we ignore
    await supabase.from('doctor_questions').insert(rows)
    // No upsert / no onConflict — avoids the missing constraint error
  }

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Fetch global predefined (profile_id = null)
    let { data: global, error: e1 } = await supabase
      .from('doctor_questions')
      .select('*')
      .is('profile_id', null)
      .order('sort_order', { ascending: true })

    if (e1) { setError(e1.message); setLoading(false); return }

    // If none exist, seed once — then re-fetch inline (no recursion)
    if (!global || global.length === 0) {
      await seedPredefined()

      const { data: seeded, error: e2 } = await supabase
        .from('doctor_questions')
        .select('*')
        .is('profile_id', null)
        .order('sort_order', { ascending: true })

      if (e2) { setError(e2.message); setLoading(false); return }
      global = seeded || []
    }

    let profileQuestions = []
    if (profileId) {
      const { data: pq, error: e3 } = await supabase
        .from('doctor_questions')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })
      if (e3) { setError(e3.message); setLoading(false); return }
      profileQuestions = pq || []
    }

    // Merge: for each global predefined, check if profile has an override
    const merged = global.map(gq => {
      const override = profileQuestions.find(pq => pq.question_key === gq.question_key)
      return override || gq
    })

    // Append profile-specific custom questions (no question_key)
    const custom = profileQuestions.filter(pq => !pq.question_key)

    setQuestions([...merged, ...custom])
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const toggleQuestion = async (question) => {
    if (!question.profile_id && profileId) {
      const newRow = {
        profile_id: profileId,
        question_key: question.question_key,
        custom_text: question.custom_text,
        is_checked: !question.is_checked,
        sort_order: question.sort_order,
      }
      const { data, error: err } = await supabase
        .from('doctor_questions')
        .insert([newRow])
        .select()
        .single()
      if (err) throw err
      setQuestions(prev => prev.map(q => q.id === question.id ? { ...data } : q))
      return
    }

    const { data, error: err } = await supabase
      .from('doctor_questions')
      .update({ is_checked: !question.is_checked })
      .eq('id', question.id)
      .select()
      .single()
    if (err) throw err
    setQuestions(prev => prev.map(q => q.id === data.id ? data : q))
  }

  const addCustomQuestion = async (text) => {
    if (!profileId || !text.trim()) return
    const newRow = {
      profile_id: profileId,
      question_key: null,
      custom_text: text.trim(),
      is_checked: false,
      sort_order: questions.length,
    }
    const { data, error: err } = await supabase
      .from('doctor_questions')
      .insert([newRow])
      .select()
      .single()
    if (err) throw err
    setQuestions(prev => [...prev, data])
  }

  const deleteCustomQuestion = async (id) => {
    const { error: err } = await supabase
      .from('doctor_questions')
      .delete()
      .eq('id', id)
    if (err) throw err
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  return { questions, loading, error, fetchQuestions, toggleQuestion, addCustomQuestion, deleteCustomQuestion }
}

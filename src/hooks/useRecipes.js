import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRecipes(profileId) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRecipes = useCallback(async (mealTypeFilter = null) => {
    if (!profileId) { setRecipes([]); return }
    setLoading(true)
    setError(null)
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
    if (mealTypeFilter) query = query.eq('meal_type', mealTypeFilter)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setRecipes(data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const addRecipe = async (recipeData) => {
    const { data, error: err } = await supabase
      .from('recipes')
      .insert([{ ...recipeData, profile_id: profileId }])
      .select()
      .single()
    if (err) throw err
    setRecipes(prev => [data, ...prev])
    return data
  }

  const updateRecipe = async (id, recipeData) => {
    const { data, error: err } = await supabase
      .from('recipes')
      .update(recipeData)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setRecipes(prev => prev.map(r => r.id === id ? data : r))
    return data
  }

  const deleteRecipe = async (id) => {
    const { error: err } = await supabase.from('recipes').delete().eq('id', id)
    if (err) throw err
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  const getRecipe = (id) => recipes.find(r => r.id === id) || null

  return { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe, getRecipe, refetch: fetchRecipes }
}

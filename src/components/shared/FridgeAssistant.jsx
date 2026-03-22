import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefrigeratorIcon, Sparkles, X, Plus, ChevronDown, ChevronUp, Clock, Flame, Beef, RefreshCw, BookmarkPlus, Check } from 'lucide-react'
import { Card } from '../ui/Card'
import { supabase } from '../../lib/supabase'

const QUICK_INGREDIENTS = [
  'Huevos', 'Arroz', 'Pollo', 'Atún', 'Tomate',
  'Cebolla', 'Ajo', 'Papa', 'Zanahoria', 'Lentejas',
]

const RECIPE_GRADIENTS = [
  'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
  'from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20',
  'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
]

const RECIPE_ACCENT = [
  { border: 'border-emerald-200 dark:border-emerald-800', tag: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', num: 'text-emerald-600' },
  { border: 'border-blue-200 dark:border-blue-800',       tag: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',             num: 'text-blue-600' },
  { border: 'border-orange-200 dark:border-orange-800',   tag: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',     num: 'text-orange-600' },
]

function RecipeSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
    </div>
  )
}

function RecipeCard({ recipe, index, t, onSave }) {
  const [showSteps, setShowSteps] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const grad = RECIPE_GRADIENTS[index % RECIPE_GRADIENTS.length]
  const accent = RECIPE_ACCENT[index % RECIPE_ACCENT.length]

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(recipe)
      setSaved(true)
    } catch {
      // no-op
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`bg-gradient-to-br ${grad} ${accent.border} border rounded-2xl p-4`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{recipe.name}</h3>
        {onSave && (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            title={saved ? t('diet.recipe_saved') : t('diet.recipe_save')}
            className="flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-60 hover:bg-white/50 dark:hover:bg-black/20"
          >
            {saved
              ? <Check size={15} className="text-green-500" />
              : <BookmarkPlus size={15} className="text-gray-400 dark:text-gray-500" />
            }
          </button>
        )}
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {recipe.prep_time_minutes && (
          <span className="flex items-center gap-1 text-xs bg-white/70 dark:bg-black/20 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
            <Clock size={11} /> {t('diet.recipe_prep_time', { n: recipe.prep_time_minutes })}
          </span>
        )}
        {recipe.calories_per_serving && (
          <span className="flex items-center gap-1 text-xs bg-white/70 dark:bg-black/20 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
            <Flame size={11} /> {t('diet.recipe_calories', { n: recipe.calories_per_serving })}
          </span>
        )}
        {recipe.macros?.protein_g && (
          <span className="flex items-center gap-1 text-xs bg-white/70 dark:bg-black/20 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
            <Beef size={11} /> {t('diet.recipe_protein', { n: recipe.macros.protein_g })}
          </span>
        )}
      </div>

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.map(tag => (
            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accent.tag}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Instructions toggle */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <>
          <button
            onClick={() => setShowSteps(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showSteps ? t('diet.recipe_hide') : t('diet.recipe_instructions')}
          </button>
          {showSteps && (
            <ol className="mt-2 flex flex-col gap-1.5">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className={`font-bold flex-shrink-0 ${accent.num}`}>{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}

export function FridgeAssistant({ profile, calTarget, remainingCalories }) {
  const { t } = useTranslation()
  const [ingredients, setIngredients] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [recipes, setRecipes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function addIngredient(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (ingredients.length >= 15) return
    if (ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) return
    setIngredients(prev => [...prev, trimmed])
    setInputValue('')
    setRecipes(null)
    setError(null)
  }

  function removeIngredient(name) {
    setIngredients(prev => prev.filter(i => i !== name))
    setRecipes(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addIngredient(inputValue)
    }
  }

  async function handleGenerate() {
    if (ingredients.length === 0) return
    setLoading(true)
    setError(null)
    setRecipes(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fridge-to-recipes', {
        body: {
          ingredients,
          healthGoal: profile?.health_goal,
          dailyCaloriesTarget: calTarget,
          remainingCalories,
        },
      })
      if (fnError) throw fnError
      if (!data?.recipes) throw new Error('Invalid response')
      setRecipes(data.recipes)
    } catch {
      setError(t('diet.fridge_error'))
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setIngredients([])
    setInputValue('')
    setRecipes(null)
    setError(null)
  }

  async function saveRecipeToDb(recipe) {
    const { error } = await supabase.from('recipes').insert([{
      profile_id: profile?.id,
      title: recipe.name,
      meal_type: 'any',
      calories_per_serving: recipe.calories_per_serving ?? null,
      protein_g: recipe.macros?.protein_g ?? null,
      carbs_g: recipe.macros?.carbs_g ?? null,
      fat_g: recipe.macros?.fat_g ?? null,
      ingredients: recipe.ingredients_used ?? [],
      instructions: recipe.instructions?.join('\n') ?? null,
    }])
    if (error) throw error
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <RefrigeratorIcon size={20} className="text-blue-500" strokeWidth={1.75} />
        <h2 className="font-bold text-gray-900 dark:text-gray-100">
          {t('diet.fridge_title')}
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('diet.fridge_subtitle')}
      </p>

      {/* Ingredients chips */}
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ingredients.map(ing => (
            <span
              key={ing}
              className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium"
            >
              {ing}
              <button
                onClick={() => removeIngredient(ing)}
                className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + Add button */}
      {!recipes && (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('diet.fridge_add_placeholder')}
              disabled={ingredients.length >= 15}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => addIngredient(inputValue)}
              disabled={!inputValue.trim() || ingredients.length >= 15}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {ingredients.length >= 15 && (
            <p className="text-xs text-gray-400 mb-2">{t('diet.fridge_max_reached')}</p>
          )}

          {/* Quick ingredients */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('diet.fridge_quick_title')}</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INGREDIENTS.filter(q => !ingredients.includes(q)).map(q => (
                <button
                  key={q}
                  onClick={() => addIngredient(q)}
                  disabled={ingredients.length >= 15}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || ingredients.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Sparkles size={16} />
            {loading ? t('diet.fridge_generating') : t('diet.fridge_btn_generate')}
          </button>

          {error && (
            <p className="text-xs text-red-500 text-center mt-2">{error}</p>
          )}
        </>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="mt-4 flex flex-col gap-3">
          <RecipeSkeleton />
          <RecipeSkeleton />
          <RecipeSkeleton />
        </div>
      )}

      {/* Recipe results */}
      {recipes && !loading && (
        <div className="flex flex-col gap-3 mt-1">
          {recipes.map((recipe, i) => (
            <RecipeCard key={i} recipe={recipe} index={i} t={t} onSave={profile?.id ? saveRecipeToDb : null} />
          ))}
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2"
          >
            <RefreshCw size={14} />
            {t('diet.fridge_try_again')}
          </button>
        </div>
      )}
    </Card>
  )
}

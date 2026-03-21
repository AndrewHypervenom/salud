import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChefHat } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useRecipes } from '../../hooks/useRecipes'
import { useProfiles } from '../../hooks/useProfiles'
import { useFoodLogs } from '../../hooks/useFoodLogs'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { supabase } from '../../lib/supabase'

const MEAL_TYPE_KEYS = [
  { value: '', labelKey: 'recipes.meal_all' },
  { value: 'breakfast', labelKey: 'food.breakfast' },
  { value: 'lunch', labelKey: 'food.lunch' },
  { value: 'dinner', labelKey: 'food.dinner' },
  { value: 'snack', labelKey: 'food.snack' },
  { value: 'any', labelKey: 'recipes.meal_any' },
]

function RecipeCard({ recipe, onDelete, t }) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async (e) => {
    e.preventDefault()
    if (!confirm(t('recipes.delete_confirm'))) return
    setDeleting(true)
    try { await onDelete(recipe.id) } catch (e) { console.error(e) }
    setDeleting(false)
  }

  return (
    <div className="relative group">
      <Link to={`/recipes/${recipe.id}`}>
        <Card className="hover:shadow-lg transition-shadow h-full">
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-32 object-cover rounded-xl mb-3 -mt-1"
            />
          )}
          <div className="flex items-start gap-2 mb-1">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight flex-1">{recipe.title}</p>
          </div>
          {recipe.meal_type && (
            <span className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full px-2 py-0.5 font-medium">
              {t(MEAL_TYPE_KEYS.find(m => m.value === recipe.meal_type)?.labelKey || recipe.meal_type)}
            </span>
          )}
          {recipe.calories_per_serving && (
            <p className="text-xs text-gray-400 mt-1">{recipe.calories_per_serving} {t('recipes.kcal_per_serving')}</p>
          )}
        </Card>
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 flex items-center justify-center"
      >
        {deleting ? '·' : '✕'}
      </button>
    </div>
  )
}

function AIIdeasTab({ profileId, todayLogs }) {
  const { t } = useTranslation()
  const [ingredients, setIngredients] = useState('')
  const [ideas, setIdeas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const preFill = () => {
    const names = todayLogs.slice(0, 5).map(l => l.description).join(', ')
    setIngredients(names || '')
  }

  const handleGenerate = async () => {
    if (!ingredients.trim()) return
    setLoading(true)
    setError(null)
    setIdeas('')
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('health-coach', {
        body: {
          mode: 'recipe_ideas',
          ingredients: ingredients.trim(),
          message: t('recipes.ai_prompt', { ingredients: ingredients.trim() }),
        },
      })
      if (fnErr) throw fnErr
      setIdeas(data?.analysis || data?.recommendations || t('recipes.ai_error'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recipes.ingredients_prompt')}</p>
        <textarea
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          placeholder={t('recipes.ingredients_placeholder')}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl resize-none focus:outline-none focus:border-primary-500 mb-2"
        />
        <div className="flex gap-2">
          {todayLogs.length > 0 && (
            <button
              onClick={preFill}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('recipes.use_todays_meals')}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={!ingredients.trim() || loading}
            className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size="sm" /> {t('recipes.generating')}</> : t('recipes.generate_ai')}
          </button>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">{error}</p>
      )}

      {ideas && (
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('recipes.ai_ideas_title')}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{ideas}</p>
        </Card>
      )}
    </div>
  )
}

export default function RecipesPage() {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { recipes, loading, deleteRecipe } = useRecipes(activeProfileId)
  const { todayLogs } = useFoodLogs(activeProfileId)
  const [tab, setTab] = useState('mine')
  const [mealFilter, setMealFilter] = useState('')

  if (!activeProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <ChefHat size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  const filtered = mealFilter ? recipes.filter(r => r.meal_type === mealFilter || r.meal_type === 'any') : recipes

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ChefHat size={26} strokeWidth={1.75} className="text-primary-500" />
          {t('recipes.title')}
        </h1>
        {tab === 'mine' && (
          <Link
            to="/recipes/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            {t('recipes.btn_new')}
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {[
          { key: 'mine', label: t('recipes.tab_mine') },
          { key: 'ai', label: t('recipes.tab_ai') },
        ].map(tabOpt => (
          <button
            key={tabOpt.key}
            onClick={() => setTab(tabOpt.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === tabOpt.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {tabOpt.label}
          </button>
        ))}
      </div>

      {tab === 'mine' ? (
        <>
          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {MEAL_TYPE_KEYS.map(mt => (
              <button
                key={mt.value}
                onClick={() => setMealFilter(mt.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  mealFilter === mt.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t(mt.labelKey)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <ChefHat size={48} strokeWidth={1.5} className="text-gray-300" />
              <p className="text-gray-400 text-sm">
                {mealFilter ? t('recipes.no_results_filter') : t('recipes.no_recipes')}
              </p>
              <Link
                to="/recipes/new"
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold"
              >
                {t('recipes.btn_create_first')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(r => (
                <RecipeCard key={r.id} recipe={r} onDelete={deleteRecipe} t={t} />
              ))}
            </div>
          )}
        </>
      ) : (
        <AIIdeasTab profileId={activeProfileId} todayLogs={todayLogs} />
      )}
    </div>
  )
}

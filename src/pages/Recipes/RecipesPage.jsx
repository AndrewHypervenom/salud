import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChefHat, ExternalLink, ChevronDown, ChevronUp, BookmarkCheck, Bookmark } from 'lucide-react'
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

  const { emoji, from, to } = recipeEmoji(recipe.title, recipe.ingredients || [])

  return (
    <div className="relative group">
      <Link to={`/recipes/${recipe.id}`}>
        <Card className="hover:shadow-lg transition-shadow h-full">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-32 object-cover rounded-xl mb-3 -mt-1"
            />
          ) : (
            <div
              className="w-full h-32 rounded-xl mb-3 -mt-1 flex flex-col items-center justify-center gap-1"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              <span style={{ fontSize: 40 }}>{emoji}</span>
            </div>
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

function recipeEmoji(name = '', ingredients = []) {
  const text = (name + ' ' + ingredients.join(' ')).toLowerCase()
  if (/pollo|chicken|pechuga|muslo/.test(text)) return { emoji: '🍗', from: '#f97316', to: '#ea580c' }
  if (/carne|beef|res|bistec|steak|cerdo|pork/.test(text)) return { emoji: '🥩', from: '#dc2626', to: '#b91c1c' }
  if (/pescado|fish|salmon|atún|tuna|camarón|shrimp/.test(text)) return { emoji: '🐟', from: '#0ea5e9', to: '#0284c7' }
  if (/pasta|espagueti|spaghetti|fideos|noodle/.test(text)) return { emoji: '🍝', from: '#d97706', to: '#b45309' }
  if (/sopa|soup|caldo|stew|estofado/.test(text)) return { emoji: '🍲', from: '#16a34a', to: '#15803d' }
  if (/ensalada|salad|verde|lechuga/.test(text)) return { emoji: '🥗', from: '#22c55e', to: '#16a34a' }
  if (/huevo|egg|tortilla|omelette/.test(text)) return { emoji: '🍳', from: '#eab308', to: '#ca8a04' }
  if (/arroz|rice/.test(text)) return { emoji: '🍚', from: '#a3e635', to: '#65a30d' }
  if (/sandwich|burger|hamburguesa|wrap/.test(text)) return { emoji: '🥪', from: '#f59e0b', to: '#d97706' }
  if (/tacos|burrito|mexicano/.test(text)) return { emoji: '🌮', from: '#f97316', to: '#c2410c' }
  if (/pizza/.test(text)) return { emoji: '🍕', from: '#ef4444', to: '#dc2626' }
  if (/curry|india|masala/.test(text)) return { emoji: '🍛', from: '#f59e0b', to: '#b45309' }
  if (/vegetariano|vegano|tofu|lenteja|garbanzo/.test(text)) return { emoji: '🥦', from: '#10b981', to: '#047857' }
  return { emoji: '🍽', from: '#8b5cf6', to: '#7c3aed' }
}

function AIRecipeCard({ recipe, profileId, t }) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const { emoji, from, to } = recipeEmoji(recipe.name, recipe.ingredients || [])
  // Imagen real de TheMealDB; si falla o no existe → placeholder con emoji
  const displayImage = !imgError && recipe.image_url ? recipe.image_url : null

  // Link prioridad: fuente real TheMealDB → YouTube → Google search
  const linkUrl = recipe.source_url || recipe.youtube_url
    || `https://www.google.com/search?q=${encodeURIComponent(recipe.name + ' receta saludable')}`

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.from('recipes').insert([{
        profile_id: profileId,
        title: recipe.name,
        description: recipe.description,
        meal_type: 'any',
        calories_per_serving: recipe.calories_per_serving,
        protein_g: recipe.macros?.protein_g,
        carbs_g: recipe.macros?.carbs_g,
        fat_g: recipe.macros?.fat_g,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions?.join('\n'),
        image_url: recipe.image_url || null,
      }])
      setSaved(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      {displayImage ? (
        <img
          src={displayImage}
          alt={recipe.name}
          onError={() => setImgError(true)}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div
          className="w-full h-44 flex flex-col items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <span style={{ fontSize: 64 }}>{emoji}</span>
          <span className="text-white text-sm font-semibold text-center px-4 leading-tight drop-shadow">{recipe.name}</span>
        </div>
      )}
      {recipe.source_url && (
        <div className="px-4 pt-2">
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
            ✓ Receta real de internet
          </span>
        </div>
      )}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">{recipe.name}</p>
          {recipe.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{recipe.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          {recipe.prep_time_minutes && (
            <span className="flex items-center gap-1">⏱ {t('recipes.prep_time_min', { min: recipe.prep_time_minutes })}</span>
          )}
          {recipe.calories_per_serving && (
            <span className="flex items-center gap-1">🔥 {recipe.calories_per_serving} kcal</span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">🍽 {t('recipes.servings_label', { n: recipe.servings })}</span>
          )}
        </div>

        {recipe.macros && (
          <div className="flex gap-3 text-xs">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg font-medium">
              P {recipe.macros.protein_g}g
            </span>
            <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg font-medium">
              C {recipe.macros.carbs_g}g
            </span>
            <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-lg font-medium">
              G {recipe.macros.fat_g}g
            </span>
          </div>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-between w-full text-xs font-semibold text-primary-600 dark:text-primary-400 py-1 border-t border-gray-100 dark:border-gray-700"
        >
          {expanded ? t('recipes.hide_steps') : t('recipes.show_steps')}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="flex flex-col gap-3 text-sm">
            {recipe.ingredients?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('recipes.ingredients_label')}</p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-0.5">
                  {recipe.ingredients.map((ing, i) => <li key={i} className="text-xs">{ing}</li>)}
                </ul>
              </div>
            )}
            {recipe.instructions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Preparación</p>
                <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  {recipe.instructions.map((step, i) => <li key={i} className="text-xs leading-relaxed">{step}</li>)}
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ExternalLink size={13} />
            {t('recipes.view_online')}
          </a>
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              saved
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
            }`}
          >
            {saved ? <><BookmarkCheck size={13} /> {t('recipes.recipe_saved')}</> : saving ? <Spinner size="sm" /> : <><Bookmark size={13} /> {t('recipes.save_recipe')}</>}
          </button>
        </div>
      </div>
    </Card>
  )
}

function AIIdeasTab({ profileId, todayLogs }) {
  const { t } = useTranslation()
  const [ingredients, setIngredients] = useState('')
  const [recipes, setRecipes] = useState([])
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
    setRecipes([])
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('health-coach', {
        body: {
          mode: 'recipe_ideas',
          ingredients: ingredients.trim(),
        },
      })
      if (fnErr) throw fnErr
      setRecipes(data?.recipes || [])
      if (!data?.recipes?.length) setError(t('recipes.ai_error'))
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

      {recipes.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('recipes.ai_ideas_title')}</p>
          {recipes.map((recipe, i) => (
            <AIRecipeCard key={i} recipe={recipe} profileId={profileId} t={t} />
          ))}
        </div>
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

  const filtered = mealFilter ? recipes.filter(r => r.meal_type === mealFilter) : recipes

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

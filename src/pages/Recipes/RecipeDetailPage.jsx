import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChefHat, Pencil, ShoppingCart, FileText } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useRecipes } from '../../hooks/useRecipes'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

export default function RecipeDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const { activeProfileId } = useProfileContext()
  const { recipes, loading } = useRecipes(activeProfileId)

  const recipe = recipes.find(r => r.id === id)

  const handleLogAsFood = () => {
    if (!recipe) return
    navigate('/food', {
      state: {
        prefill: {
          description: recipe.title,
          calories_estimated: recipe.calories_per_serving,
          protein_g: recipe.protein_g,
          carbs_g: recipe.carbs_g,
          fat_g: recipe.fat_g,
          notes: t('recipes.from_recipe'),
        }
      }
    })
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <ChefHat size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-500">{t('recipes.not_found')}</p>
        <Link to="/recipes" className="text-primary-600 underline text-sm">{t('recipes.back_to_recipes')}</Link>
      </div>
    )
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : typeof recipe.ingredients === 'string'
    ? [recipe.ingredients]
    : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1">{recipe.title}</h1>
        <Link
          to={`/recipes/${id}/edit`}
          className="text-sm text-primary-600 font-medium"
        >
          <Pencil size={14} strokeWidth={2} className="inline mr-1" />{t('common.edit')}
        </Link>
      </div>

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full max-h-64 object-cover rounded-2xl"
        />
      )}

      {recipe.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{recipe.description}</p>
      )}

      {/* Macros */}
      {(recipe.calories_per_serving || recipe.protein_g) && (
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('recipes.macros_per_serving')}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {recipe.calories_per_serving && (
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{recipe.calories_per_serving}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
            )}
            {recipe.protein_g != null && (
              <div>
                <p className="text-xl font-bold text-blue-500">{recipe.protein_g}g</p>
                <p className="text-xs text-gray-400">{t('food.protein')}</p>
              </div>
            )}
            {recipe.carbs_g != null && (
              <div>
                <p className="text-xl font-bold text-green-500">{recipe.carbs_g}g</p>
                <p className="text-xs text-gray-400">{t('recipes.carbs_short')}</p>
              </div>
            )}
            {recipe.fat_g != null && (
              <div>
                <p className="text-xl font-bold text-amber-500">{recipe.fat_g}g</p>
                <p className="text-xs text-gray-400">{t('food.fat')}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Ingredientes */}
      {ingredients.length > 0 && (
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ShoppingCart size={14} strokeWidth={1.75} />{t('recipes.ingredients_label')}
          </p>
          <ul className="flex flex-col gap-1.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-primary-500 font-bold mt-0.5">·</span>
                {ing}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Instrucciones */}
      {recipe.instructions && (
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <FileText size={14} strokeWidth={1.75} />{t('recipes.instructions_label')}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {recipe.instructions}
          </p>
        </Card>
      )}

      {/* Botón registrar */}
      <button
        onClick={handleLogAsFood}
        className="w-full py-4 bg-primary-600 text-white rounded-2xl text-base font-bold hover:bg-primary-700 transition-colors"
      >
        {t('recipes.log_as_food')}
      </button>
    </div>
  )
}

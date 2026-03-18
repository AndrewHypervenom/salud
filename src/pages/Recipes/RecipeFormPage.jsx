import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useRecipes } from '../../hooks/useRecipes'
import { useBadges } from '../../hooks/useBadges'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

const MEAL_TYPE_KEYS = [
  { value: 'breakfast', labelKey: 'food.breakfast' },
  { value: 'lunch', labelKey: 'food.lunch' },
  { value: 'dinner', labelKey: 'food.dinner' },
  { value: 'snack', labelKey: 'food.snack' },
  { value: 'any', labelKey: 'recipes.meal_any' },
]

export default function RecipeFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { activeProfileId } = useProfileContext()
  const { recipes, addRecipe, updateRecipe } = useRecipes(activeProfileId)
  const { checkAndUnlock } = useBadges(activeProfileId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState('any')
  const [instructions, setInstructions] = useState('')
  const [ingredientText, setIngredientText] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit && recipes.length > 0) {
      const recipe = recipes.find(r => r.id === id)
      if (recipe) {
        setTitle(recipe.title || '')
        setDescription(recipe.description || '')
        setMealType(recipe.meal_type || 'any')
        setInstructions(recipe.instructions || '')
        const ingrs = recipe.ingredients
        if (Array.isArray(ingrs)) setIngredientText(ingrs.join('\n'))
        else if (typeof ingrs === 'string') setIngredientText(ingrs)
        setCalories(recipe.calories_per_serving || '')
        setProtein(recipe.protein_g || '')
        setCarbs(recipe.carbs_g || '')
        setFat(recipe.fat_g || '')
        setImageUrl(recipe.image_url || null)
        if (recipe.image_url) setImagePreview(recipe.image_url)
      }
    }
  }, [isEdit, recipes, id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const uploadImage = async () => {
    if (!imageFile) return imageUrl
    const ext = imageFile.name.split('.').pop() || 'jpg'
    const path = `${activeProfileId}/recipes/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('food-images')
      .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
    if (uploadErr) throw new Error(uploadErr.message)
    const { data } = supabase.storage.from('food-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const finalImageUrl = await uploadImage()
      const ingredients = ingredientText.trim()
        ? ingredientText.split('\n').map(s => s.trim()).filter(Boolean)
        : null
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        meal_type: mealType,
        instructions: instructions.trim() || null,
        ingredients,
        calories_per_serving: calories ? parseInt(calories) : null,
        protein_g: protein ? parseInt(protein) : null,
        carbs_g: carbs ? parseInt(carbs) : null,
        fat_g: fat ? parseInt(fat) : null,
        image_url: finalImageUrl || null,
      }
      if (isEdit) {
        await updateRecipe(id, payload)
      } else {
        const created = await addRecipe(payload)
        await checkAndUnlock('first_recipe', true)
        navigate(`/recipes/${created.id}`, { replace: true })
        return
      }
      navigate(-1)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? t('recipes.edit_recipe') : t('recipes.new_recipe')}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">{t('recipes.form_title_label')}</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('recipes.placeholder_title')}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Tipo de comida */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">{t('recipes.form_meal_type_label')}</label>
            <div className="grid grid-cols-3 gap-2">
              {MEAL_TYPE_KEYS.map(mt => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setMealType(mt.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
                    mealType === mt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t(mt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">{t('recipes.form_description_label')}</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('recipes.placeholder_description')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Foto */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">{t('recipes.form_photo_label')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {imagePreview && (
              <img src={imagePreview} alt="" className="mt-2 w-full max-h-40 object-cover rounded-xl" />
            )}
          </div>

          {/* Ingredientes */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
              {t('recipes.form_ingredients_label')}
            </label>
            <textarea
              value={ingredientText}
              onChange={e => setIngredientText(e.target.value)}
              placeholder={t('recipes.placeholder_ingredients')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Instrucciones */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">{t('recipes.form_instructions_label')}</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder={t('recipes.placeholder_instructions')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Macros */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">{t('recipes.form_macros_label')}</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="kcal" min="0"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl" />
              <input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder={t('recipes.placeholder_protein')} min="0"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl" />
              <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder={t('recipes.placeholder_carbs')} min="0"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl" />
              <input type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder={t('recipes.placeholder_fat')} min="0"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={!title.trim() || saving}
              className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700 transition-colors">
              {saving ? <Spinner size="sm" /> : t('common.save')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

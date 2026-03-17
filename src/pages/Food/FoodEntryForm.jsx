import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { FoodAnalyzingOverlay } from '../../components/ui/FoodAnalyzingOverlay'
import { MacroResultCard } from '../../components/ui/MacroResultCard'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export function FoodEntryForm({ initialMealType = 'breakfast', profileId, onSave, onCancel }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)

  const [mealType, setMealType] = useState(initialMealType)
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [aiCalories, setAiCalories] = useState('')
  const [aiMacros, setAiMacros] = useState(null)
  const [showResultCard, setShowResultCard] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImageUrl(null)
    setAiUsed(false)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    setAnalyzing(true)
    setError(null)
    try {
      // Upload to Supabase Storage first
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const path = `${profileId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('food-images')
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      setImageUrl(publicUrl)

      // Call Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke('analyze-food', {
        body: { imageUrl: publicUrl },
      })
      if (fnErr) throw new Error(fnErr.message)

      if (data?.description) {
        setDescription(data.description)
        setAiDescription(data.description)
      }
      if (data?.calories_estimated) {
        const cal = String(data.calories_estimated)
        setCalories(cal)
        setAiCalories(cal)
      }
      setAiMacros(data?.macros ?? null)
      setShowResultCard(true)
      setAiUsed(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleRecalculate = async () => {
    if (!description.trim()) return
    setRecalculating(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('analyze-food', {
        body: { description: description.trim() },
      })
      if (fnErr) throw new Error(fnErr.message)
      if (data?.calories_estimated) {
        const cal = String(data.calories_estimated)
        setCalories(cal)
        setAiCalories(cal)
        setAiDescription(description.trim())
        setAiMacros(data?.macros ?? null)
        setShowResultCard(true)
        setAiUsed(true)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setRecalculating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        meal_type: mealType,
        description: description.trim(),
        calories_estimated: calories ? parseInt(calories) : null,
        image_url: imageUrl || null,
        notes: notes.trim() || null,
        protein_g: aiMacros?.protein_g ?? null,
        carbs_g: aiMacros?.carbs_g ?? null,
        fat_g: aiMacros?.fat_g ?? null,
        fiber_g: aiMacros?.fiber_g ?? null,
      })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const descriptionChanged = aiUsed && description.trim() !== aiDescription.trim()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Meal type selector */}
      <div className="grid grid-cols-4 gap-2">
        {MEAL_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setMealType(type)}
            className={`py-2 px-1 rounded-xl text-xs font-semibold transition-colors ${
              mealType === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t(`food.${type}`)}
          </button>
        ))}
      </div>

      {/* Photo — se oculta cuando se muestra la tarjeta resultado */}
      {!showResultCard && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('food.photo')}</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            📷 {t('food.photo')}
          </button>

          {imagePreview && (
            <div className="flex flex-col gap-2">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full max-h-48 object-cover rounded-xl"
                />
                {analyzing && <FoodAnalyzingOverlay imagePreview={imagePreview} />}
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:scale-[1.02] hover:shadow-purple-500/50 transition-all disabled:opacity-40 disabled:scale-100 text-sm"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" /> {t('food.analyzing')}
                  </span>
                ) : (
                  `✨ ${t('food.analyze_ai')}`
                )}
              </button>
            </div>
          )}

          {aiUsed && (
            <div className="flex items-center gap-2 animate-success-pop">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                <span className="text-base">✓</span>
                {t('food.ai_filled')}
              </span>
            </div>
          )}
        </div>
      )}

      {showResultCard ? (
        <MacroResultCard
          imagePreview={imagePreview}
          description={description}
          calories={calories ? parseInt(calories) : null}
          macros={aiMacros}
          onEdit={() => setShowResultCard(false)}
        />
      ) : (
        <>
          {/* Description */}
          <div className={`flex flex-col gap-1 ${aiUsed ? 'animate-fade-in-up' : ''}`}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('food.description')}</label>
            <input
              type="text"
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                if (aiUsed && e.target.value.trim() === aiDescription.trim() && aiCalories) {
                  setCalories(aiCalories)
                }
              }}
              placeholder={t('food.description_placeholder')}
              required
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {!aiUsed && description.trim() && (
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={recalculating}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {recalculating
                ? <><Spinner size="sm" /> {t('food.calculating')}</>
                : `🤖 ${t('food.calculate_calories')}`}
            </button>
          )}

          {descriptionChanged && (
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={recalculating}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {recalculating
                ? <><Spinner size="sm" /> {t('food.recalculating')}</>
                : `🔄 ${t('food.recalculate_calories')}`}
            </button>
          )}

          {/* Calories */}
          <div className={`flex flex-col gap-1 ${aiUsed ? 'animate-fade-in-up' : ''}`}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('food.calories')}</label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              min="0"
              max="5000"
              placeholder="350"
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('food.notes')}</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="..."
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving || !description.trim()}
          className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-700 transition-colors text-sm"
        >
          {saving ? <Spinner size="sm" /> : t('food.save')}
        </button>
      </div>
    </form>
  )
}

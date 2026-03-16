import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'

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

      if (data?.description) setDescription(data.description)
      if (data?.calories_estimated) setCalories(String(data.calories_estimated))
      setAiUsed(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
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
      })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

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
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`food.${type}`)}
          </button>
        ))}
      </div>

      {/* Photo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">{t('food.photo')}</label>
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
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          📷 {t('food.photo')}
        </button>

        {imagePreview && (
          <div className="flex flex-col gap-2">
            <img
              src={imagePreview}
              alt="preview"
              className="w-full max-h-48 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-40 text-sm"
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
          <p className="text-xs text-purple-600 font-medium">✓ {t('food.ai_filled')}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t('food.description')}</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('food.description_placeholder')}
          required
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Calories */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t('food.calories')}</label>
        <input
          type="number"
          value={calories}
          onChange={e => setCalories(e.target.value)}
          min="0"
          max="5000"
          placeholder="350"
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t('food.notes')}</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="..."
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
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

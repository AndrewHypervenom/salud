import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, ChevronDown, ChevronUp, Crown, AlertTriangle, Sparkles, X, RefreshCw, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ── Compresión de imagen antes de subir ──────────────────────────────────────
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.75)
    }
    img.src = url
  })
}

async function uploadToStorage(slot, profileId) {
  const compressed = await compressImage(slot.file)
  const path = `${profileId || 'compare'}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage.from('food-images').upload(path, compressed, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('food-images').getPublicUrl(path)
  return data.publicUrl
}

// ── HealthScoreBar ────────────────────────────────────────────────────────────
function HealthScoreBar({ score }) {
  const color = score >= 7 ? 'bg-emerald-500' : score >= 4 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? color : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums w-8 text-right">{score}/10</span>
    </div>
  )
}

// ── SlotActionSheet ───────────────────────────────────────────────────────────
function SlotActionSheet({ slot, onClose, onReplace, onRemove, onView }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-[var(--surface)] rounded-t-3xl px-5 pb-10 pt-3 animate-spring-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-black/15 dark:bg-white/15 rounded-full mx-auto mb-4" />
        {slot.preview && (
          <img src={slot.preview} alt="" className="w-full h-32 object-cover rounded-2xl mb-4" />
        )}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { onView(); onClose() }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-900 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-800 transition-colors text-left font-medium"
          >
            {t('food_search.photos_action_view')}
          </button>
          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
          <button
            onClick={() => { onReplace(); onClose() }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-900 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-800 transition-colors text-left font-medium"
          >
            {t('food_search.photos_action_replace')}
          </button>
          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
          <button
            onClick={() => { onRemove(); onClose() }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 active:bg-red-50 dark:active:bg-red-900/20 transition-colors text-left font-medium"
          >
            {t('food_search.photos_action_remove')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PhotoSlot ─────────────────────────────────────────────────────────────────
function PhotoSlot({ slot, onAdd, onTap }) {
  if (!slot) {
    return (
      <button
        onClick={onAdd}
        className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
      >
        <span className="text-2xl text-gray-300 dark:text-gray-600 font-light leading-none">+</span>
      </button>
    )
  }
  return (
    <button
      onClick={onTap}
      className="aspect-square rounded-3xl overflow-hidden relative active:scale-95 transition-transform"
    >
      <img src={slot.preview} alt="" className="w-full h-full object-cover" />
      <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-full p-1">
        <Camera size={10} className="text-white" />
      </div>
    </button>
  )
}

// ── FoodRankItem ──────────────────────────────────────────────────────────────
function FoodRankItem({ food, rank, isWinner, onUse, t }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-2xl p-4 border transition-all ${isWinner ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-800 bg-[var(--surface)]'}`}>
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${isWinner ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          {isWinner ? <Crown size={13} /> : rank}
        </div>
        {/* Thumbnail */}
        {food.localPreview && (
          <img src={food.localPreview} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        )}
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{food.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{food.calories} kcal</p>
          <div className="mt-2">
            <HealthScoreBar score={food.healthScore} />
          </div>
        </div>
      </div>

      {/* Expandable pros/cons */}
      {(food.pros?.length > 0 || food.cons?.length > 0) && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in-up">
          {food.pros?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">{t('food_search.photos_pros')}</p>
              <ul className="space-y-0.5">
                {food.pros.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <Check size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {food.cons?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 mb-1">{t('food_search.photos_cons')}</p>
              <ul className="space-y-0.5">
                {food.cons.map((c, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <X size={11} className="text-red-400 mt-0.5 flex-shrink-0" />{c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Use button */}
      <button
        onClick={() => onUse(food)}
        className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
          isWinner
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        {t('food_search.photos_use')}
      </button>
    </div>
  )
}

// ── PhotoAnalysisMode (main) ──────────────────────────────────────────────────
export function PhotoAnalysisMode({ onUseFood, profileId }) {
  const { t } = useTranslation()
  const [slots, setSlots] = useState([])
  const [context, setContext] = useState('')
  const [phase, setPhase] = useState('idle') // idle | analyzing | results | error
  const [results, setResults] = useState(null)
  const [activeSlotIndex, setActiveSlotIndex] = useState(null)
  const [viewingPhoto, setViewingPhoto] = useState(null)
  const [contextOpen, setContextOpen] = useState(false)
  const fileInputRef = useRef(null)
  const replacingSlotIdRef = useRef(null)

  const filledCount = slots.length

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (replacingSlotIdRef.current !== null) {
      // Reemplazar slot existente
      const slotId = replacingSlotIdRef.current
      replacingSlotIdRef.current = null
      const file = files[0]
      const preview = URL.createObjectURL(file)
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, file, preview } : s))
    } else {
      // Agregar nuevos slots hasta máx 6
      setSlots(prev => {
        const remaining = 6 - prev.length
        const toAdd = files.slice(0, remaining).map(file => ({
          id: Date.now() + Math.random(),
          file,
          preview: URL.createObjectURL(file),
        }))
        return [...prev, ...toAdd]
      })
    }
    e.target.value = ''
  }, [])

  const handleAddSlot = () => {
    replacingSlotIdRef.current = null
    fileInputRef.current?.click()
  }

  const handleReplaceSlot = (slotId) => {
    replacingSlotIdRef.current = slotId
    fileInputRef.current?.click()
  }

  const handleRemoveSlot = (slotId) => {
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  const handleAnalyze = async () => {
    if (slots.length === 0) return
    setPhase('analyzing')
    try {
      // Subir todas las fotos en paralelo
      const publicUrls = await Promise.all(slots.map(slot => uploadToStorage(slot, profileId)))

      const { data, error } = await supabase.functions.invoke('compare-foods', {
        body: { imageUrls: publicUrls, context: context.trim() || undefined },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      // Enriquecer con previews locales
      const enriched = {
        ...data,
        foods: data.foods.map((f, i) => ({ ...f, localPreview: slots[i]?.preview })),
      }
      setResults(enriched)
      setPhase('results')
    } catch (err) {
      console.error('compare-foods error:', err)
      setPhase('error')
    }
  }

  const handleUseFood = (food) => {
    onUseFood({
      name: food.name,
      brand: '',
      serving_size: 'porción estimada',
      calories: food.calories,
      calories_per_100g: food.calories,
      protein_g: food.macros?.protein_g ?? 0,
      carbs_g: food.macros?.carbs_g ?? 0,
      fat_g: food.macros?.fat_g ?? 0,
    })
  }

  const handleReset = () => {
    setPhase('idle')
    setResults(null)
  }

  // ── RESULTADOS ──────────────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    const { foods, winner, recommendation, warnings } = results
    const sortedFoods = [...foods]
      .map((f, i) => ({ ...f, originalIndex: i }))
      .sort((a, b) => b.healthScore - a.healthScore)
    const winnerFood = foods[winner?.index ?? 0]

    return (
      <div className="flex flex-col gap-4 animate-fade-in-up pb-6">
        {/* Tarjeta ganadora */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              {t('food_search.photos_winner_label')}
            </span>
          </div>
          <div className="flex items-start gap-3">
            {winnerFood?.localPreview && (
              <img src={winnerFood.localPreview} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{winnerFood?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{winnerFood?.calories} kcal</p>
              <div className="mt-2">
                <HealthScoreBar score={winnerFood?.healthScore ?? 0} />
              </div>
            </div>
          </div>
          {winner?.reason && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 italic mt-3 border-t border-emerald-200 dark:border-emerald-800 pt-3">
              {winner.reason}
            </p>
          )}
          <button
            onClick={() => handleUseFood(winnerFood)}
            className="mt-4 w-full py-3 bg-emerald-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            {t('food_search.photos_use')}
          </button>
        </div>

        {/* Recomendación */}
        {recommendation && (
          <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700 rounded-2xl px-4 py-3 flex gap-2">
            <Sparkles size={16} className="text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">{t('food_search.photos_recommendation')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
            </div>
          </div>
        )}

        {/* Advertencias */}
        {warnings?.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t('food_search.photos_warnings')}</p>
            </div>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ranking completo */}
        {sortedFoods.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
              {t('food_search.photos_rank_label')}
            </p>
            <div className="flex flex-col gap-2">
              {sortedFoods.map((food, rank) => (
                <FoodRankItem
                  key={food.originalIndex}
                  food={food}
                  rank={rank + 1}
                  isWinner={food.originalIndex === (winner?.index ?? 0)}
                  onUse={handleUseFood}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* Analizar de nuevo */}
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
        >
          <RefreshCw size={15} />
          {t('food_search.photos_try_again')}
        </button>
      </div>
    )
  }

  // ── ANALIZANDO ──────────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 animate-fade-in-up">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-brand-200 dark:border-brand-800 border-t-brand-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={24} className="text-brand-600 dark:text-brand-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{t('food_search.photos_analyzing')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filledCount} {filledCount === 1 ? 'foto' : 'fotos'}
          </p>
        </div>
      </div>
    )
  }

  // ── ERROR ───────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 animate-fade-in-up">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <X size={24} className="text-red-500" />
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">{t('food_search.photos_error')}</p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm"
        >
          <RefreshCw size={14} />
          {t('food_search.photos_try_again')}
        </button>
      </div>
    )
  }

  // ── IDLE ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Subtítulo */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {t('food_search.photos_subtitle')}
      </p>

      {/* Grid de fotos 3×2 */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => {
          const slot = slots[i]
          return (
            <PhotoSlot
              key={i}
              slot={slot}
              onAdd={handleAddSlot}
              onTap={() => setActiveSlotIndex(i)}
            />
          )
        })}
      </div>

      {/* Contexto opcional (colapsable) */}
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        <button
          onClick={() => setContextOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          {t('food_search.photos_context_label')}
          {contextOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {contextOpen && (
          <div className="px-4 pb-3">
            <input
              type="text"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder={t('food_search.photos_context_placeholder')}
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}
      </div>

      {/* Botón CTA */}
      <button
        onClick={handleAnalyze}
        disabled={filledCount === 0}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
          filledCount > 0
            ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        <Sparkles size={18} />
        {filledCount === 0
          ? t('food_search.photos_cta')
          : filledCount === 1
            ? t('food_search.photos_cta_count_one')
            : t('food_search.photos_cta_count_other', { count: filledCount })
        }
      </button>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* SlotActionSheet */}
      {activeSlotIndex !== null && slots[activeSlotIndex] && (
        <SlotActionSheet
          slot={slots[activeSlotIndex]}
          onClose={() => setActiveSlotIndex(null)}
          onView={() => setViewingPhoto(slots[activeSlotIndex]?.preview)}
          onReplace={() => handleReplaceSlot(slots[activeSlotIndex]?.id)}
          onRemove={() => {
            handleRemoveSlot(slots[activeSlotIndex]?.id)
            setActiveSlotIndex(null)
          }}
        />
      )}

      {/* Visor de foto fullscreen */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setViewingPhoto(null)}
        >
          <img src={viewingPhoto} alt="" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-safe-top top-6 right-6 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
            onClick={() => setViewingPhoto(null)}
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

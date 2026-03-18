import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useFoodSearch } from '../../hooks/useFoodSearch'
import { useBadges } from '../../hooks/useBadges'
import { BarcodeScanner } from '../../components/ui/BarcodeScanner'
import { NutritionTable } from '../../components/ui/NutritionTable'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { FoodAnalyzingOverlay } from '../../components/ui/FoodAnalyzingOverlay'
import { calcMacros, calcTDEE, calcBMR, calcCalorieTarget } from '../../lib/formulas'
import { BadgeNotification } from '../../components/shared/BadgeNotification'
import { supabase } from '../../lib/supabase'

function ResultItem({ item, onAdd }) {
  const [expanded, setExpanded] = useState(false)
  const [qty, setQty] = useState('100')

  const adjustedItem = {
    ...item,
    calories: Math.round((item.calories_per_100g * parseInt(qty || 100)) / 100),
    protein_g: Math.round((item.protein_g * parseInt(qty || 100)) / 100 * 10) / 10,
    carbs_g: Math.round((item.carbs_g * parseInt(qty || 100)) / 100 * 10) / 10,
    fat_g: Math.round((item.fat_g * parseInt(qty || 100)) / 100 * 10) / 10,
    serving_size: `${qty}g`,
  }

  return (
    <Card className="flex flex-col gap-2">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {item.image_url && (
          <img src={item.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{item.name}</p>
          {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
          <p className="text-xs text-primary-600 font-medium mt-0.5">{item.calories_per_100g} kcal/100g</p>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 flex-shrink-0">Cantidad:</label>
            <input
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              min="1"
              max="2000"
              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-center"
            />
            <span className="text-xs text-gray-400">g</span>
          </div>
          <NutritionTable items={[adjustedItem]} />
          <button
            onClick={() => onAdd(adjustedItem)}
            className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            + Agregar a diario
          </button>
        </div>
      )}
    </Card>
  )
}

const MACRO_TILES = [
  { key: 'calories', unitKey: 'kcal',             tileCls: 'bg-amber-50  dark:bg-amber-900/20  border border-amber-100  dark:border-amber-800/30',  numCls: 'text-amber-600  dark:text-amber-400'  },
  { key: 'protein',  unitKey: 'food_search.prot_short',  tileCls: 'bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30', numCls: 'text-violet-600 dark:text-violet-400' },
  { key: 'carbs',    unitKey: 'food_search.carbs_short', tileCls: 'bg-blue-50   dark:bg-blue-900/20   border border-blue-100   dark:border-blue-800/30',   numCls: 'text-blue-600   dark:text-blue-400'   },
  { key: 'fat',      unitKey: 'food_search.fat_short',   tileCls: 'bg-red-50    dark:bg-red-900/20    border border-red-100    dark:border-red-800/30',    numCls: 'text-red-600    dark:text-red-400'    },
]

function ManualFoodEntry({ barcode, profileId, onAdd }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)

  // phase: 'idle' | 'selected' | 'analyzing' | 'review'
  const [phase, setPhase] = useState('idle')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imagePublicUrl, setImagePublicUrl] = useState(null)
  const [error, setError] = useState(null)
  const [correction, setCorrection] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', qty: '100' })

  const sf = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const qty = parseInt(form.qty) || 100
  const totalCal = form.calories ? Math.round(parseFloat(form.calories) * qty / 100) : null

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    setPhase('selected')
  }

  const handleAnalyze = async () => {
    setPhase('analyzing')
    setError(null)
    try {
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const path = `${profileId || 'labels'}/labels/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('food-images')
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(path)
      setImagePublicUrl(urlData.publicUrl)

      const { data, error: fnErr } = await supabase.functions.invoke('analyze-food', {
        body: { imageUrl: urlData.publicUrl, mode: 'label' },
      })
      if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error)

      setForm({
        name: data.name || '',
        calories: String(data.calories_per_100g ?? ''),
        protein: String(data.protein_g ?? ''),
        carbs: String(data.carbs_g ?? ''),
        fat: String(data.fat_g ?? ''),
        qty: '100',
      })
      setPhase('review')
    } catch (e) {
      setError(e.message)
      setPhase('selected')
    }
  }

  const handleRecalculate = async () => {
    if (!correction.trim() || !imagePublicUrl) return
    setRecalculating(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('analyze-food', {
        body: { imageUrl: imagePublicUrl, mode: 'label', correction: correction.trim() },
      })
      if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error)
      setForm(f => ({
        ...f,
        name:     data.name              != null ? data.name                        : f.name,
        calories: data.calories_per_100g != null ? String(data.calories_per_100g)  : f.calories,
        protein:  data.protein_g         != null ? String(data.protein_g)           : f.protein,
        carbs:    data.carbs_g           != null ? String(data.carbs_g)             : f.carbs,
        fat:      data.fat_g             != null ? String(data.fat_g)               : f.fat,
      }))
      setCorrection('')
    } catch (e) {
      setError(e.message)
    } finally {
      setRecalculating(false)
    }
  }

  const handleAdd = () => {
    const q = parseInt(form.qty) || 100
    const c100 = parseFloat(form.calories) || 0
    onAdd({
      name: form.name || `Producto ${barcode}`,
      brand: '',
      serving_size: `${q}g`,
      calories: Math.round(c100 * q / 100),
      calories_per_100g: c100,
      protein_g: Math.round((parseFloat(form.protein) || 0) * q / 100 * 10) / 10,
      carbs_g:   Math.round((parseFloat(form.carbs)   || 0) * q / 100 * 10) / 10,
      fat_g:     Math.round((parseFloat(form.fat)     || 0) * q / 100 * 10) / 10,
    })
  }

  const inputBase = "w-full px-4 py-3.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"

  /* ── Fase: analizando ── */
  if (phase === 'analyzing') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <div className="relative rounded-3xl overflow-hidden shadow-lg" style={{ minHeight: 220 }}>
          {imagePreview && (
            <img src={imagePreview} alt="" className="w-full h-56 object-cover" />
          )}
          <FoodAnalyzingOverlay imagePreview={imagePreview} />
        </div>
      </div>
    )
  }

  /* ── Fase: imagen seleccionada ── */
  if (phase === 'selected') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <div className="relative rounded-3xl overflow-hidden shadow-lg">
          <img src={imagePreview} alt="" className="w-full h-56 object-cover" />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 rounded-2xl px-4 py-3">
            <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          ✨ {t('food_search.analyze_ai')}
        </button>

        <button
          type="button"
          onClick={() => { setPhase('idle'); setImagePreview(null); setImageFile(null); setError(null) }}
          className="w-full py-3 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {t('food_search.change_photo')}
        </button>
      </div>
    )
  }

  /* ── Fase: revisión post-IA ── */
  if (phase === 'review') {
    return (
      <div className="flex flex-col gap-5 animate-fade-in-up">

        {/* Imagen + badge */}
        {imagePreview && (
          <div className="relative rounded-3xl overflow-hidden shadow-lg">
            <img src={imagePreview} alt="" className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold shadow-sm">
                ✓ {t('food_search.ai_extracted')}
              </span>
            </div>
          </div>
        )}

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            {t('food_search.manual_name')}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={sf('name')}
            placeholder={t('food_search.manual_name')}
            className={inputBase}
          />
        </div>

        {/* Tiles de macros editables */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            {t('food_search.per_100g')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MACRO_TILES.map(({ key, unitKey, tileCls, numCls }) => {
              const unit = unitKey.startsWith('food_search.') ? t(unitKey) : unitKey
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div className={`w-full rounded-2xl ${tileCls} flex flex-col items-center justify-center py-3 px-1 gap-0.5`}>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form[key]}
                      onChange={sf(key)}
                      className={`w-full text-center text-base font-bold bg-transparent border-none outline-none tabular-nums leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${numCls}`}
                    />
                    <span className={`text-[10px] font-semibold leading-none ${numCls} opacity-70`}>{unit}</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 text-center leading-tight">
                    {key === 'calories' ? 'Cal' : unit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cantidad + total */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            {t('food_search.manual_qty')}
          </label>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3">
            <input
              type="number"
              min="1"
              max="2000"
              value={form.qty}
              onChange={sf('qty')}
              className="flex-1 text-3xl font-black text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-base font-semibold text-gray-400">g</span>
          </div>
          {totalCal !== null && (
            <div className="flex items-baseline gap-1.5 px-1 pt-0.5">
              <span className="text-4xl font-black text-gray-900 dark:text-gray-100 tabular-nums leading-none">{totalCal}</span>
              <span className="text-base font-semibold text-gray-400">kcal</span>
              <span className="text-xs text-gray-400 ml-0.5">{t('food_search.total_label').toLowerCase()}</span>
            </div>
          )}
        </div>

        {/* Corrección */}
        <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-4 py-4">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('food.incorrect_question')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={correction}
              onChange={e => setCorrection(e.target.value)}
              placeholder={t('food_search.correction_placeholder')}
              onKeyDown={e => e.key === 'Enter' && correction.trim() && handleRecalculate()}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-all"
            />
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={!correction.trim() || recalculating}
              className="px-3.5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700 active:scale-95 transition-all flex items-center"
            >
              {recalculating ? <Spinner size="sm" /> : '🔄'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 rounded-2xl px-4 py-3">
            <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-base hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-500/20"
        >
          {t('food_search.manual_add')}
        </button>
      </div>
    )
  }

  /* ── Fase: idle (estado inicial) ── */
  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">

      {/* Cabecera */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-lg">📋</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{t('food_search.not_in_db')}</p>
          {barcode && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{barcode}</p>}
        </div>
      </div>

      {/* Botón de captura de foto */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group flex flex-col items-center justify-center gap-3 w-full py-9 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 active:scale-[0.98] transition-all"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 flex items-center justify-center transition-colors shadow-sm">
          <span className="text-3xl">📷</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            {t('food_search.take_photo')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{t('food_search.scan_label_hint')}</p>
        </div>
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs font-medium text-gray-400">{t('food_search.manual_entry_toggle')}</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Formulario manual */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder={t('food_search.manual_name')}
          value={form.name}
          onChange={sf('name')}
          className={inputBase}
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" placeholder={t('food_search.manual_calories')} value={form.calories} onChange={sf('calories')} className={inputBase} />
          <input type="number" min="1" max="2000" placeholder={t('food_search.manual_qty')} value={form.qty} onChange={sf('qty')} className={inputBase} />
          <input type="number" min="0" step="0.1" placeholder={t('food_search.manual_protein')} value={form.protein} onChange={sf('protein')} className={inputBase} />
          <input type="number" min="0" step="0.1" placeholder={t('food_search.manual_carbs')} value={form.carbs} onChange={sf('carbs')} className={inputBase} />
          <input type="number" min="0" step="0.1" placeholder={t('food_search.manual_fat')} value={form.fat} onChange={sf('fat')} className={inputBase} />
        </div>
        {totalCal !== null && (
          <div className="flex items-baseline gap-1.5 px-1">
            <span className="text-3xl font-black text-gray-900 dark:text-gray-100 tabular-nums">{totalCal}</span>
            <span className="text-sm font-semibold text-gray-400">kcal {t('food_search.total_label').toLowerCase()}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-base hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-500/20 mt-1"
        >
          {t('food_search.manual_add')}
        </button>
      </div>
    </div>
  )
}

export default function FoodSearchPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const profile = profiles.find(p => p.id === activeProfileId)
  const { results, loading, error, searchByName, searchByBarcode, clearResults } = useFoodSearch()
  const { newBadge, clearNewBadge } = useBadges(activeProfileId)

  const [query, setQuery] = useState('')
  const [scanMode, setScanMode] = useState(searchParams.get('mode') === 'scan')
  const [scanned, setScanned] = useState(null)
  const searchRef = useRef(null)
  const scanLockRef = useRef(false)

  const calTarget = profile
    ? calcCalorieTarget(
        calcTDEE(calcBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex), profile.activity),
        profile.health_goal
      )
    : null
  const macros = calTarget ? calcMacros(calTarget) : null

  const handleSearch = () => {
    if (query.trim()) searchByName(query)
  }

  const handleScan = async (code) => {
    if (scanLockRef.current) return
    scanLockRef.current = true
    setScanMode(false)
    setScanned(code)
    clearResults()
    await searchByBarcode(code)
    scanLockRef.current = false
  }

  const handleAdd = (item) => {
    navigate('/food', {
      state: {
        prefill: {
          description: `${item.name}${item.brand ? ` (${item.brand})` : ''} - ${item.serving_size}`,
          calories_estimated: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        }
      }
    })
  }

  const dailyRef = macros ? {
    calories: calTarget,
    protein_g: macros.protein_g,
    carbs_g: macros.carbs_g,
    fat_g: macros.fat_g,
  } : null

  return (
    <div className="flex flex-col gap-4">
      <BadgeNotification badge={newBadge} onDismiss={clearNewBadge} lang={lang} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🔍 {t('food_search.title')}</h1>

      {/* Buscador */}
      {!scanMode && (
        <div className="flex gap-2">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={t('food_search.search_placeholder')}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-primary-700 transition-colors"
          >
            {loading ? <Spinner size="sm" /> : '🔍'}
          </button>
          <button
            onClick={() => setScanMode(true)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            📷
          </button>
        </div>
      )}

      {/* Escáner */}
      {scanMode && (
        <Card>
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setScanMode(false)}
            active={scanMode}
          />
        </Card>
      )}

      {/* Código escaneado */}
      {scanned && !scanMode && (
        <p className="text-xs text-gray-500 text-center">
          {t('food_search.scanned_code')} <span className="font-mono font-semibold">{scanned}</span>
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">
          {scanned ? t('food_search.not_in_db') : error}
        </p>
      )}

      {/* Entrada manual cuando no se encuentra por código */}
      {scanned && !loading && results.length === 0 && error && (
        <ManualFoodEntry barcode={scanned} profileId={activeProfileId} onAdd={handleAdd} />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8"><Spinner /></div>
      )}

      {/* Resultados */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          {results.map((item, i) => (
            <ResultItem key={item.barcode || i} item={item} onAdd={handleAdd} dailyRef={dailyRef} />
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !error && results.length === 0 && (query || scanned) && (
        <div className="flex flex-col items-center py-12 text-center gap-3">
          <span className="text-5xl">🔍</span>
          <p className="text-gray-400 text-sm">{t('food_search.no_results')}</p>
        </div>
      )}

      {/* Estado inicial */}
      {!loading && results.length === 0 && !query && !scanned && (
        <div className="flex flex-col items-center py-8 text-center gap-3">
          <span className="text-5xl">🥗</span>
          <p className="text-gray-400 text-sm">{t('food_search.hint')}</p>
        </div>
      )}
    </div>
  )
}

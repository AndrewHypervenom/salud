import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, ScanLine, Images } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useFoodSearch } from '../../hooks/useFoodSearch'
import { useBadges } from '../../hooks/useBadges'
import { useCustomProducts } from '../../hooks/useCustomProducts'
import { BarcodeScanner } from '../../components/ui/BarcodeScanner'
import { NutritionTable } from '../../components/ui/NutritionTable'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { FoodAnalyzingOverlay } from '../../components/ui/FoodAnalyzingOverlay'
import { calcMacros, calcTDEE, calcBMR, calcCalorieTarget } from '../../lib/formulas'
import { BadgeNotification } from '../../components/shared/BadgeNotification'
import { supabase } from '../../lib/supabase'
import { PhotoAnalysisMode } from './PhotoAnalysisMode'

// ─── Segmented Control tipo iOS ───────────────────────────────────────────────
function SegmentedControl({ value, onChange, t }) {
  const tabs = [
    { key: 'search',  label: t('food_search.tab_search'),  icon: <Search size={13} /> },
    { key: 'barcode', label: t('food_search.tab_barcode'), icon: <ScanLine size={13} /> },
    { key: 'photos',  label: t('food_search.tab_photos'),  icon: <Images size={13} /> },
  ]
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl gap-1">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
            value === tab.key
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Unidades con su factor de conversión a gramos ───────────────────────────
const UNITS = [
  { key: 'g',       label: 'g',      factor: 1 },
  { key: 'ml',      label: 'ml',     factor: 1 },
  { key: 'oz',      label: 'oz',     factor: 28.35 },
  { key: 'taza',    label: 'taza',   factor: 240 },
  { key: 'cdas',    label: 'cdas.',  factor: 15 },
  { key: 'cdta',    label: 'cdta.',  factor: 5 },
  { key: 'porcion', label: 'porción', factor: null },
]

const MACRO_TILES = [
  { key: 'calories', unitKey: 'kcal',                    tileCls: 'bg-amber-50  dark:bg-amber-900/20  border border-amber-100  dark:border-amber-800/30',  numCls: 'text-amber-600  dark:text-amber-400'  },
  { key: 'protein',  unitKey: 'food_search.prot_short',  tileCls: 'bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30', numCls: 'text-violet-600 dark:text-violet-400' },
  { key: 'carbs',    unitKey: 'food_search.carbs_short', tileCls: 'bg-blue-50   dark:bg-blue-900/20   border border-blue-100   dark:border-blue-800/30',   numCls: 'text-blue-600   dark:text-blue-400'   },
  { key: 'fat',      unitKey: 'food_search.fat_short',   tileCls: 'bg-red-50    dark:bg-red-900/20    border border-red-100    dark:border-red-800/30',    numCls: 'text-red-600    dark:text-red-400'    },
]

// ─── Helper: stepper step por unidad ─────────────────────────────────────────
function stepFor(unit) {
  return unit === 'g' || unit === 'ml' ? 10 : unit === 'oz' ? 0.5 : 1
}

// ─── Selector de cantidad + unidad reutilizable ───────────────────────────────
function QtyUnitPicker({ qty, unit, portionGrams, onQty, onUnit, onPortionGrams }) {
  const step = stepFor(unit)
  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Stepper */}
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
        <button
          type="button"
          onClick={() => onQty(String(Math.max(0, (parseFloat(qty) || 0) - step)))}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold hover:bg-gray-50 active:scale-90 transition-all select-none"
        >−</button>
        <input
          type="number"
          min="0"
          step="any"
          size={3}
          value={qty}
          onChange={e => onQty(e.target.value)}
          className="flex-1 min-w-0 w-0 text-3xl font-black text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onQty(String((parseFloat(qty) || 0) + step))}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold hover:bg-gray-50 active:scale-90 transition-all select-none"
        >+</button>
      </div>

      {/* Unit pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide min-w-0 w-full">
        {UNITS.map(u => (
          <button
            key={u.key}
            type="button"
            onClick={() => onUnit(u.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
              unit === u.key
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >{u.label}</button>
        ))}
      </div>

      {/* Definición de porción */}
      {unit === 'porcion' && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl px-4 py-3">
          <span className="text-sm text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap">1 porción =</span>
          <input
            type="number"
            min="1"
            value={portionGrams}
            onChange={e => onPortionGrams(e.target.value)}
            className="flex-1 text-lg font-bold text-amber-900 dark:text-amber-100 bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">g</span>
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta de resumen nutricional total ─────────────────────────────────────
function TotalCard({ totalCal, protein, carbs, fat, gramsEq, unit }) {
  if (totalCal === null && gramsEq === 0) return null
  return (
    <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl px-5 py-5">
      <div className="flex items-end gap-2 mb-3">
        <span className="text-5xl font-black text-white tabular-nums leading-none">{totalCal ?? 0}</span>
        <div className="mb-1">
          <span className="text-base font-semibold text-gray-400">kcal</span>
          {gramsEq > 0 && (
            <span className="text-xs text-gray-600 ml-2">
              {unit === 'porcion' ? `${gramsEq.toFixed(0)}g equiv.` : `· ${gramsEq % 1 === 0 ? gramsEq : gramsEq.toFixed(1)}g`}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-5">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-violet-400 tabular-nums leading-tight">
            {protein}<span className="text-xs font-medium ml-0.5">g</span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Prot.</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-blue-400 tabular-nums leading-tight">
            {carbs}<span className="text-xs font-medium ml-0.5">g</span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Carb.</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-red-400 tabular-nums leading-tight">
            {fat}<span className="text-xs font-medium ml-0.5">g</span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Grasas</span>
        </div>
      </div>
    </div>
  )
}

// ─── ResultItem ───────────────────────────────────────────────────────────────
function ResultItem({ item, onAdd }) {
  const { t } = useTranslation()
  const [qty, setQty] = useState('100')
  const [unit, setUnit] = useState('g')
  const [portionGrams, setPortionGrams] = useState('100')

  const unitObj = UNITS.find(u => u.key === unit) || UNITS[0]
  const gramsEq = unitObj.factor !== null
    ? (parseFloat(qty) || 0) * unitObj.factor
    : (parseFloat(qty) || 0) * (parseFloat(portionGrams) || 100)

  const adj = (val) => Math.round((val * gramsEq) / 100 * 10) / 10
  const totalCal = Math.round((item.calories_per_100g * gramsEq) / 100)
  const adjustedItem = {
    ...item,
    calories: totalCal,
    protein_g: adj(item.protein_g),
    carbs_g: adj(item.carbs_g),
    fat_g: adj(item.fat_g),
    serving_size: unitObj.factor !== null
      ? `${gramsEq % 1 === 0 ? gramsEq : gramsEq.toFixed(1)}g`
      : `${qty} porción (${gramsEq.toFixed(0)}g)`,
  }

  return (
    <Card className="flex flex-col gap-2 overflow-hidden">
      <div className="flex items-start gap-3">
        {item.image_url && (
          <img src={item.image_url} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name}</p>
            {item.source === 'local' && (
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                {t('food_search.local_product_badge')}
              </span>
            )}
          </div>
          {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs text-primary-600 font-medium">{item.calories_per_100g} kcal</span>
            <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded-full text-[10px] font-bold">P {item.protein_g}g</span>
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-[10px] font-bold">C {item.carbs_g}g</span>
            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full text-[10px] font-bold">G {item.fat_g}g</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            Cantidad
          </label>
          <QtyUnitPicker
            qty={qty} unit={unit} portionGrams={portionGrams}
            onQty={setQty} onUnit={setUnit} onPortionGrams={setPortionGrams}
          />
        </div>

        <TotalCard
          totalCal={totalCal}
          protein={adj(item.protein_g)}
          carbs={adj(item.carbs_g)}
          fat={adj(item.fat_g)}
          gramsEq={gramsEq}
          unit={unit}
        />

        <button
          onClick={() => onAdd(adjustedItem)}
          className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          + {t('food_search.manual_add')}
        </button>
      </div>
    </Card>
  )
}

// ─── ProductCard (en My Products) ────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete, onUse, deleting }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {product.image_url
          ? <img src={product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📦</span>
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">{product.name}</p>
          {product.brand && <p className="text-xs text-gray-400 truncate">{product.brand}</p>}
          <p className="text-xs text-primary-600 font-medium mt-0.5">{product.calories_per_100g} kcal/100g</p>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">P {product.protein_g}g</span>
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">C {product.carbs_g}g</span>
            <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">G {product.fat_g}g</span>
            {product.barcode && (
              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs font-mono">{product.barcode}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onUse}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 active:scale-95 transition-all"
            >
              Usar producto
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm hover:bg-gray-200 active:scale-95 transition-all"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {deleting ? <Spinner size="sm" /> : '🗑️'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── EditProductForm (en My Products) ────────────────────────────────────────
function EditProductForm({ form, setForm, imagePreview, onImageChange, onImageRemove, onSave, onCancel, saving, fileRef }) {
  const sf = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const cls = "w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-gray-400"
  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Foto */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={e => { const f = e.target.files[0]; if (f) onImageChange(f) }}
        className="hidden" />
      {imagePreview
        ? <div className="relative rounded-xl overflow-hidden">
            <img src={imagePreview} alt="" className="w-full h-32 object-cover" />
            <button type="button" onClick={onImageRemove}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70">
              ✕
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-black/50 text-white rounded-full text-xs hover:bg-black/70">
              📸 Cambiar
            </button>
          </div>
        : <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 w-full px-4 py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-400 transition-all">
            <span className="text-xl">📸</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Agregar foto del producto</span>
          </button>
      }

      <input type="text" value={form.name} onChange={sf('name')} placeholder="Nombre del producto" className={cls} />
      <input type="text" value={form.brand || ''} onChange={sf('brand')} placeholder="Marca (opcional)" className={cls} />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">Cal/100g</label>
          <input type="number" min="0" value={form.calories_per_100g} onChange={sf('calories_per_100g')} className={cls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">Proteína (g)</label>
          <input type="number" min="0" step="0.1" value={form.protein_g} onChange={sf('protein_g')} className={cls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">Carboh. (g)</label>
          <input type="number" min="0" step="0.1" value={form.carbs_g} onChange={sf('carbs_g')} className={cls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">Grasas (g)</label>
          <input type="number" min="0" step="0.1" value={form.fat_g} onChange={sf('fat_g')} className={cls} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all">
          Cancelar
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
          {saving ? <Spinner size="sm" /> : null} Guardar
        </button>
      </div>
    </div>
  )
}

// ─── MyProductsSheet ──────────────────────────────────────────────────────────
function MyProductsSheet({ profileId, open, onClose, onUseProduct }) {
  const { listByProfile, updateProduct, deleteProduct } = useCustomProducts()
  const editFileRef = useRef(null)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!open || !profileId) return
    setLoading(true)
    listByProfile(profileId).then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [open, profileId, listByProfile])

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      brand: product.brand || '',
      calories_per_100g: String(product.calories_per_100g),
      protein_g: String(product.protein_g),
      carbs_g: String(product.carbs_g),
      fat_g: String(product.fat_g),
    })
    setEditImagePreview(product.image_url || null)
    setEditImageFile(null)
  }

  const saveEdit = async () => {
    const product = products.find(p => p.id === editingId)
    if (!product) return
    setSaving(true)
    try {
      await updateProduct(editingId, product.barcode, editForm, editImageFile)
      const updated = await listByProfile(profileId)
      setProducts(updated)
      setEditingId(null)
    } catch (_) {}
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mis Productos</h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {products.length} producto{products.length !== 1 ? 's' : ''} guardado{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
          {loading && <div className="flex justify-center py-16"><Spinner /></div>}

          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <span className="text-5xl">📦</span>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Sin productos guardados</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[220px] leading-relaxed">
                Los productos que registres manualmente aparecerán aquí para futuras consultas
              </p>
            </div>
          )}

          {products.map(product => (
            <div key={product.id} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl overflow-hidden">
              {editingId === product.id
                ? <EditProductForm
                    form={editForm}
                    setForm={setEditForm}
                    imagePreview={editImagePreview}
                    onImageChange={file => { setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)) }}
                    onImageRemove={() => { setEditImageFile(null); setEditImagePreview(null) }}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                    fileRef={editFileRef}
                  />
                : <ProductCard
                    product={product}
                    onEdit={() => startEdit(product)}
                    onDelete={() => handleDelete(product.id)}
                    onUse={() => { onUseProduct(product); onClose() }}
                    deleting={deleting === product.id}
                  />
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── ManualFoodEntry ──────────────────────────────────────────────────────────
function ManualFoodEntry({ barcode, profileId, onAdd }) {
  const { t } = useTranslation()
  const labelFileRef = useRef(null)
  const productFileRef = useRef(null)
  const { saveProduct } = useCustomProducts()

  const [phase, setPhase] = useState('idle')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imagePublicUrl, setImagePublicUrl] = useState(null)
  const [error, setError] = useState(null)
  const [correction, setCorrection] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', qty: '100' })
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState(null)
  const [unit, setUnit] = useState('g')
  const [portionGrams, setPortionGrams] = useState('100')

  const sf = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const unitObj = UNITS.find(u => u.key === unit) || UNITS[0]
  const gramsEq = unitObj.factor !== null
    ? (parseFloat(form.qty) || 0) * unitObj.factor
    : (parseFloat(form.qty) || 0) * (parseFloat(portionGrams) || 100)

  const totalCal = form.calories && gramsEq > 0
    ? Math.round(parseFloat(form.calories) * gramsEq / 100)
    : null
  const adjMacro = (val) => Math.round((parseFloat(val) || 0) * gramsEq / 100 * 10) / 10

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
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
      if (fnErr) throw new Error(fnErr.message)
      if (!data) throw new Error('La IA no devolvió datos.')
      if (data?.error) throw new Error(data.error)

      const n = (a, b, c, d) => a ?? b ?? c ?? d ?? ''
      const num = (v) => (v != null && v !== '' ? String(v) : '')
      setForm({
        name:     String(n(data.name, data.product_name, data.product, '') || ''),
        calories: num(n(data.calories_per_100g, data.calories, data.energy_kcal, data['energy-kcal'])),
        protein:  num(n(data.protein_g, data.proteins_g, data.protein, data.proteins)),
        carbs:    num(n(data.carbs_g, data.carbohydrates_g, data.carbs, data.carbohydrates)),
        fat:      num(n(data.fat_g, data.fats_g, data.fat, data.fats)),
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
        name:     data.name              != null ? data.name                       : f.name,
        calories: data.calories_per_100g != null ? String(data.calories_per_100g) : f.calories,
        protein:  data.protein_g         != null ? String(data.protein_g)          : f.protein,
        carbs:    data.carbs_g           != null ? String(data.carbs_g)            : f.carbs,
        fat:      data.fat_g             != null ? String(data.fat_g)              : f.fat,
      }))
      setCorrection('')
    } catch (e) {
      setError(e.message)
    } finally {
      setRecalculating(false)
    }
  }

  const handleAdd = async () => {
    const servingLabel = unit === 'porcion'
      ? `${form.qty} porción (${gramsEq.toFixed(0)}g)`
      : `${gramsEq % 1 === 0 ? gramsEq : gramsEq.toFixed(1)}${unit}`

    const item = {
      name: form.name || `Producto ${barcode || 'manual'}`,
      brand: '',
      serving_size: servingLabel,
      calories: totalCal || 0,
      calories_per_100g: parseFloat(form.calories) || 0,
      protein_g: adjMacro(form.protein),
      carbs_g: adjMacro(form.carbs),
      fat_g: adjMacro(form.fat),
    }

    if (barcode) {
      setSaving(true)
      try {
        await saveProduct({
          barcode,
          name: item.name,
          brand: '',
          calories_per_100g: parseFloat(form.calories) || 0,
          protein_g: parseFloat(form.protein) || 0,
          carbs_g: parseFloat(form.carbs) || 0,
          fat_g: parseFloat(form.fat) || 0,
          productImageFile,
          contributedBy: profileId,
        })
      } catch (_) {}
      setSaving(false)
    }

    onAdd(item)
  }

  const inputBase = "w-full px-4 py-3.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"

  // ── Analizando ──────────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <div className="relative rounded-3xl overflow-hidden shadow-lg" style={{ minHeight: 220 }}>
          {imagePreview && <img src={imagePreview} alt="" className="w-full h-56 object-cover" />}
          <FoodAnalyzingOverlay imagePreview={imagePreview} />
        </div>
      </div>
    )
  }

  // ── Foto seleccionada ───────────────────────────────────────────────────────
  if (phase === 'selected') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <div className="relative rounded-3xl overflow-hidden shadow-lg">
          <img src={imagePreview} alt="" className="w-full h-56 object-cover" />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold shadow-sm">
              📋 Etiqueta nutricional
            </span>
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 rounded-2xl px-4 py-3">
            <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{error}</p>
          </div>
        )}
        <button type="button" onClick={handleAnalyze}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          ✨ {t('food_search.analyze_ai')}
        </button>
        <button type="button"
          onClick={() => { setPhase('idle'); setImagePreview(null); setImageFile(null); setError(null) }}
          className="w-full py-3 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
          {t('food_search.change_photo')}
        </button>
      </div>
    )
  }

  // ── Revisión post-IA ────────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="flex flex-col gap-6 animate-fade-in-up pb-2">

        {/* 1 · Foto del producto (prominente) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            {t('food_search.product_photo_btn')}
          </label>
          <input
            ref={productFileRef}
            type="file" accept="image/*" capture="environment"
            onChange={e => {
              const file = e.target.files[0]
              if (!file) return
              setProductImageFile(file)
              setProductImagePreview(URL.createObjectURL(file))
            }}
            className="hidden"
          />
          {productImagePreview
            ? <div className="relative rounded-2xl overflow-hidden shadow-md">
                <img src={productImagePreview} alt="" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <button type="button"
                  onClick={() => { setProductImageFile(null); setProductImagePreview(null) }}
                  className="absolute top-3 right-3 w-7 h-7 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70 transition-colors">
                  ✕
                </button>
                <button type="button"
                  onClick={() => productFileRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 text-white rounded-full text-xs font-semibold hover:bg-black/70 transition-colors">
                  📸 Cambiar
                </button>
              </div>
            : <button type="button"
                onClick={() => productFileRef.current?.click()}
                className="group flex items-center gap-4 w-full px-5 py-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 active:scale-[0.98] transition-all">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 flex items-center justify-center transition-colors flex-shrink-0">
                  <span className="text-2xl">📸</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    {t('food_search.product_photo_btn')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('food_search.product_photo_hint')}</p>
                </div>
              </button>
          }
        </div>

        {/* 2 · Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            {t('food_search.manual_name')}
          </label>
          <input type="text" value={form.name} onChange={sf('name')}
            placeholder={t('food_search.manual_name')} className={inputBase} />
        </div>

        {/* 3 · Macros por 100g */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            {t('food_search.per_100g')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MACRO_TILES.map(({ key, unitKey, tileCls, numCls }) => {
              const ul = unitKey.startsWith('food_search.') ? t(unitKey) : unitKey
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div className={`w-full rounded-2xl ${tileCls} flex flex-col items-center justify-center py-3 px-1 gap-0.5`}>
                    <input
                      type="number" min="0" step="0.1"
                      value={form[key]} onChange={sf(key)}
                      className={`w-full text-center text-base font-bold bg-transparent border-none outline-none tabular-nums leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${numCls}`}
                    />
                    <span className={`text-[10px] font-semibold leading-none ${numCls} opacity-70`}>{ul}</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 text-center leading-tight">
                    {key === 'calories' ? 'Cal' : ul}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4 · Cantidad + unidad */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            Cantidad consumida
          </label>
          <QtyUnitPicker
            qty={form.qty} unit={unit} portionGrams={portionGrams}
            onQty={v => setForm(f => ({ ...f, qty: v }))}
            onUnit={setUnit}
            onPortionGrams={setPortionGrams}
          />
        </div>

        {/* 5 · Total */}
        <TotalCard
          totalCal={totalCal}
          protein={adjMacro(form.protein)}
          carbs={adjMacro(form.carbs)}
          fat={adjMacro(form.fat)}
          gramsEq={gramsEq}
          unit={unit}
        />

        {/* 6 · Corrección IA (con thumbnail de etiqueta como referencia) */}
        <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            {imagePreview && (
              <div className="relative flex-shrink-0">
                <img src={imagePreview} alt="" className="w-10 h-10 rounded-lg object-cover opacity-70" />
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-purple-600 text-white px-1 rounded-sm font-bold">IA</span>
              </div>
            )}
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t('food.incorrect_question')}
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={correction} onChange={e => setCorrection(e.target.value)}
              placeholder={t('food_search.correction_placeholder')}
              onKeyDown={e => e.key === 'Enter' && correction.trim() && handleRecalculate()}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-all"
            />
            <button type="button" onClick={handleRecalculate} disabled={!correction.trim() || recalculating}
              className="px-3.5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700 active:scale-95 transition-all flex items-center">
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

        {/* 7 · CTA */}
        <button type="button" onClick={handleAdd} disabled={saving}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-base hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Spinner size="sm" /> : null}
          {t('food_search.manual_add')}
        </button>
      </div>
    )
  }

  // ── Idle (entrada manual sin foto) ─────────────────────────────────────────
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

      {/* Indicador de progreso */}
      {(() => {
        const steps = [
          { label: 'Foto', done: phase !== 'idle', active: phase === 'idle' },
          { label: 'Analizar', done: phase === 'review', active: phase === 'selected' || phase === 'analyzing' },
          { label: 'Confirmar', done: false, active: phase === 'review' },
        ]
        return (
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  step.done ? 'bg-primary-100 text-primary-600' :
                  step.active ? 'bg-primary-600 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>{step.done ? '✓' : i + 1}</div>
                <span className={`text-[10px] font-semibold ${step.active ? 'text-primary-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step.done ? 'bg-primary-300' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>
        )
      })()}

      {/* Captura de etiqueta nutricional */}
      <input ref={labelFileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <button type="button" onClick={() => labelFileRef.current?.click()}
        className="group flex flex-col items-center justify-center gap-3 w-full py-9 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 active:scale-[0.98] transition-all">
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

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs font-medium text-gray-400">{t('food_search.manual_entry_toggle')}</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Formulario manual */}
      <div className="flex flex-col gap-3">
        <input type="text" placeholder={t('food_search.manual_name')} value={form.name} onChange={sf('name')} className={inputBase} />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" placeholder={t('food_search.manual_calories')} value={form.calories} onChange={sf('calories')} className={inputBase} />
          <input type="number" min="0" step="0.1" placeholder={t('food_search.manual_protein')} value={form.protein} onChange={sf('protein')} className={inputBase} />
          <input type="number" min="0" step="0.1" placeholder={t('food_search.manual_carbs')} value={form.carbs} onChange={sf('carbs')} className={inputBase} />
          <input type="number" min="0" step="0.1" placeholder={t('food_search.manual_fat')} value={form.fat} onChange={sf('fat')} className={inputBase} />
        </div>

        {/* Cantidad + unidad */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
            Cantidad consumida
          </label>
          <QtyUnitPicker
            qty={form.qty} unit={unit} portionGrams={portionGrams}
            onQty={v => setForm(f => ({ ...f, qty: v }))}
            onUnit={setUnit}
            onPortionGrams={setPortionGrams}
          />
        </div>

        {totalCal !== null && (
          <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl px-4 py-3.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tabular-nums">{totalCal}</span>
              <span className="text-sm font-semibold text-gray-400">kcal total</span>
            </div>
          </div>
        )}

        <button type="button" onClick={handleAdd} disabled={saving}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-base hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-500/20 disabled:opacity-60 mt-1 flex items-center justify-center gap-2">
          {saving ? <Spinner size="sm" /> : null}
          {t('food_search.manual_add')}
        </button>
      </div>
    </div>
  )
}

// ─── FoodSearchPage ───────────────────────────────────────────────────────────
export default function FoodSearchPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const profile = profiles.find(p => p.id === activeProfileId)
  const { results, loading, error, searchByName, searchByBarcode, clearResults, injectResults } = useFoodSearch()
  const { searchByBarcode: searchLocal, listByProfile } = useCustomProducts()
  const { newBadge, clearNewBadge } = useBadges(activeProfileId)

  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'scan' ? 'barcode' : 'search')
  const [scanMode, setScanMode] = useState(false)
  const [scanned, setScanned] = useState(null)
  const [myProductsOpen, setMyProductsOpen] = useState(false)
  const [scanProcessing, setScanProcessing] = useState(false)
  const [recentProducts, setRecentProducts] = useState([])
  const searchRef = useRef(null)
  const scanLockRef = useRef(false)

  useEffect(() => {
    if (!activeProfileId) return
    listByProfile(activeProfileId).then(data => setRecentProducts((data || []).slice(0, 6)))
  }, [activeProfileId])

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
    setScanProcessing(true)

    const localProduct = await searchLocal(code)
    if (localProduct) {
      injectResults([localProduct])
      setScanProcessing(false)
      scanLockRef.current = false
      return
    }

    await searchByBarcode(code)
    setScanProcessing(false)
    scanLockRef.current = false
  }

  const handleAdd = (item) => {
    navigate('/food', {
      state: {
        prefill: {
          meal_type: 'snack',
          description: `${item.name}${item.brand ? ` (${item.brand})` : ''} - ${item.serving_size}`,
          calories_estimated: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        }
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <BadgeNotification badge={newBadge} onDismiss={clearNewBadge} lang={lang} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">✨ {t('food_search.title')}</h1>
        {activeProfileId && activeTab !== 'photos' && (
          <button
            onClick={() => setMyProductsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            📦 Mis productos
          </button>
        )}
      </div>

      {/* Segmented Control */}
      <SegmentedControl value={activeTab} onChange={setActiveTab} t={t} />

      {/* ── TAB: Buscar ──────────────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div key="tab-search" className="flex flex-col gap-4 animate-fade-in-up">
          {/* Chips de acceso rápido a Mis Productos */}
          {recentProducts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {recentProducts.map(p => (
                <button key={p.id} onClick={() => injectResults([p])}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800
                             rounded-2xl border border-gray-200 dark:border-gray-700
                             shadow-sm flex-shrink-0 active:scale-95 transition-all">
                  {p.product_image_url
                    ? <img src={p.product_image_url} className="w-6 h-6 rounded-md object-cover flex-shrink-0" alt="" />
                    : <span className="text-base">📦</span>
                  }
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 max-w-[72px] truncate">{p.name}</span>
                    <span className="text-[10px] text-gray-400">{p.calories_per_100g} kcal</span>
                  </div>
                </button>
              ))}
              <button onClick={() => setMyProductsOpen(true)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xs font-semibold text-gray-500 flex-shrink-0 active:scale-95 transition-all whitespace-nowrap">
                Ver todos →
              </button>
            </div>
          )}

          {/* Buscador */}
          <div className="flex gap-2">
            <input
              ref={searchRef}
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('food_search.search_placeholder')}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
            <button onClick={handleSearch} disabled={!query.trim() || loading}
              className="px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-primary-700 transition-colors">
              {loading ? <Spinner size="sm" /> : '🔍'}
            </button>
          </div>

          {/* Error */}
          {error && !(scanned && results.length === 0) && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Loading — skeletons */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Resultados */}
          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
              {results.map((item, i) => (
                <ResultItem key={item.barcode || i} item={item} onAdd={handleAdd} />
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && !error && results.length === 0 && query && !scanned && (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <span className="text-5xl">🔍</span>
              <p className="text-gray-400 text-sm">{t('food_search.no_results')}</p>
            </div>
          )}

          {/* Estado inicial */}
          {!loading && results.length === 0 && !query && !scanned && !scanProcessing && (
            <div className="flex flex-col gap-3 py-2">
              <button onClick={() => searchRef.current?.focus()}
                className="flex flex-col items-center justify-center gap-2 py-10
                           bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           rounded-3xl active:scale-[0.97] transition-all shadow-sm">
                <span className="text-4xl">🔍</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Buscar por nombre</span>
                <span className="text-[11px] text-gray-400 text-center leading-tight">+3 millones de productos</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Código de Barras ─────────────────────────────────────────────── */}
      {activeTab === 'barcode' && (
        <div key="tab-barcode" className="flex flex-col gap-4 animate-fade-in-up">
          <button
            onClick={() => setScanMode(true)}
            className="flex flex-col items-center justify-center gap-3 py-12
                       bg-gray-900 dark:bg-gray-950 text-white rounded-3xl
                       active:scale-[0.97] transition-all shadow-lg w-full"
          >
            <span className="text-5xl">📷</span>
            <span className="text-lg font-bold">Escanear código</span>
            <span className="text-sm text-gray-400 text-center leading-tight">Apunta al código de barras del envase</span>
          </button>

          {/* Estado post-escaneo */}
          {scanned && !scanMode && (
            <p className="text-xs text-gray-500 text-center">
              {t('food_search.scanned_code')} <span className="font-mono font-semibold">{scanned}</span>
            </p>
          )}
          {scanProcessing && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Spinner />
              <p className="text-sm text-gray-500">Buscando código <span className="font-mono font-bold">{scanned}</span>…</p>
            </div>
          )}
          {/* Resultados del escaneo */}
          {!loading && !scanProcessing && results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((item, i) => (
                <ResultItem key={item.barcode || i} item={item} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Analizar Fotos ───────────────────────────────────────────────── */}
      {activeTab === 'photos' && (
        <div key="tab-photos" className="animate-fade-in-up">
          <PhotoAnalysisMode profileId={activeProfileId} onUseFood={handleAdd} />
        </div>
      )}

      {/* ── Sheets globales (funcionan sobre cualquier tab) ───────────────────── */}

      {/* Escáner fullscreen */}
      {scanMode && (
        <BarcodeScanner onScan={handleScan} onClose={() => setScanMode(false)} active={scanMode} fullscreen />
      )}

      {/* ManualFoodEntry como bottom-sheet cuando barcode no encontrado */}
      {scanned && !loading && !scanProcessing && results.length === 0 && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setScanned(null); clearResults() }} />
          <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-center px-5 pt-4 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <div>
                <p className="text-xs text-gray-400">Código: <span className="font-mono font-bold">{scanned}</span></p>
                <p className="font-bold text-gray-900 dark:text-gray-100">Producto no encontrado</p>
              </div>
              <button onClick={() => { setScanned(null); clearResults() }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-sm">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-8">
              <ManualFoodEntry barcode={scanned} profileId={activeProfileId} onAdd={handleAdd} />
            </div>
          </div>
        </div>
      )}

      {/* My Products sheet */}
      <MyProductsSheet
        profileId={activeProfileId}
        open={myProductsOpen}
        onClose={() => setMyProductsOpen(false)}
        onUseProduct={product => injectResults([product])}
      />
    </div>
  )
}

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
import { calcMacros, calcTDEE, calcBMR, calcCalorieTarget } from '../../lib/formulas'
import { BadgeNotification } from '../../components/shared/BadgeNotification'

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
    setScanMode(false)
    setScanned(code)
    clearResults()
    await searchByBarcode(code)
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
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">{error}</p>
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
      {!loading && !error && results.length === 0 && query && (
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

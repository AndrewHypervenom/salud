import { useTranslation } from 'react-i18next'

const MACRO_CONFIG = [
  { key: 'fat_g',     labelKey: 'food.fat',     kcalPerG: 9 },
  { key: 'protein_g', labelKey: 'food.protein', kcalPerG: 4 },
  { key: 'carbs_g',   labelKey: 'food.carbs',   kcalPerG: 4 },
  { key: 'fiber_g',   labelKey: 'food.fiber',   kcalPerG: 2 },
]

const STATUS_COLOR = {
  ok:      '#22c55e', // verde  — dentro del rango
  warning: '#f59e0b', // ámbar  — límite
  excess:  '#ef4444', // rojo   — demasiado
  low:     '#a78bfa', // violeta — insuficiente
}

// Semáforo basado en % del objetivo diario del usuario consumido en esta comida
function getMacroStatus(key, mealGrams, dailyGrams) {
  if (mealGrams == null || !dailyGrams) return null
  const pct = (mealGrams / dailyGrams) * 100

  if (key === 'fiber_g') {
    // Fibra: más es mejor
    if (pct >= 20) return 'ok'
    if (pct >= 10) return 'warning'
    return 'low' // insuficiente — violeta
  }

  if (key === 'protein_g') {
    // Proteínas: si muy bajas, es insuficiente (no exceso)
    if (pct <= 45) return 'ok'
    if (pct <= 65) return 'warning'
    return 'excess'
  }

  // Fat, carbs: una comida debería usar ~25-45% del presupuesto diario
  if (pct <= 45) return 'ok'
  if (pct <= 65) return 'warning'
  return 'excess'
}

// Fallback cuando no hay datos del usuario: % de calorías de la comida
function getMacroStatusFromCalPct(key, calPct) {
  if (calPct == null) return null
  switch (key) {
    case 'fat_g':
      return calPct <= 35 ? 'ok' : calPct <= 45 ? 'warning' : 'excess'
    case 'protein_g':
      return calPct >= 15 ? 'ok' : calPct >= 10 ? 'warning' : 'low'
    case 'carbs_g':
      return calPct >= 40 && calPct <= 65 ? 'ok' : calPct > 75 ? 'excess' : 'warning'
    case 'fiber_g':
      return null
    default:
      return null
  }
}

function getRecommendation(macros, dailyMacros) {
  if (!macros) return null

  const keys = []

  // Evaluamos cada macro contra el presupuesto diario
  for (const { key } of MACRO_CONFIG) {
    const mealG = macros[key]
    const dailyG = dailyMacros?.[key]
    const status = getMacroStatus(key, mealG, dailyG)

    if (key === 'fat_g' && status === 'excess') keys.push('macro.fat_excess')
    if (key === 'protein_g' && status === 'excess') keys.push('macro.protein_excess')
    if (key === 'carbs_g' && status === 'excess') keys.push('macro.carbs_excess')
    if (key === 'fiber_g' && status === 'excess') keys.push('macro.fiber_low')
    if (key === 'fiber_g' && status === 'warning') keys.push('macro.fiber_warning')
  }

  return keys.length === 0 ? 'macro.balanced' : keys[0]
}

export function MacroResultCard({ imagePreview, description, calories, macros, dailyMacros, onEdit }) {
  const { t } = useTranslation()

  const title = description?.split(' con ')?.[0]?.split(',')?.[0] || description || ''

  const totalMacroCals = macros
    ? MACRO_CONFIG.reduce((sum, m) => sum + (macros[m.key] || 0) * m.kcalPerG, 0)
    : 0

  const calPct = (key, kcalPerG) =>
    macros && totalMacroCals > 0
      ? Math.round(((macros[key] || 0) * kcalPerG / totalMacroCals) * 100)
      : null

  const recommendation = getRecommendation(macros, dailyMacros)

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Imagen */}
      {imagePreview && (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={imagePreview} alt="food" className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <p className="text-white font-bold text-lg leading-snug drop-shadow">{title}</p>
          </div>
        </div>
      )}

      {!imagePreview && (
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">{title}</p>
      )}

      {/* Descripción */}
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">{description}</p>
      )}

      {/* Calorías */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-5xl font-black text-gray-900 dark:text-gray-100 tabular-nums">
          {calories ?? '—'}
        </span>
        <span className="text-lg text-gray-400 font-medium">kcal</span>
        {dailyMacros && calories && (
          <span className="text-xs text-gray-400 ml-1">
            ({Math.round((calories / (dailyMacros.protein_kcal + dailyMacros.fat_kcal + dailyMacros.carbs_kcal)) * 100)}% {t('macro.daily_pct')})
          </span>
        )}
      </div>

      {/* Círculos de macros con semáforo */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {MACRO_CONFIG.map(({ key, labelKey, kcalPerG }) => {
          const grams = macros?.[key] ?? null
          const p = calPct(key, kcalPerG)
          const status = dailyMacros
            ? getMacroStatus(key, grams, dailyMacros[key])
            : getMacroStatusFromCalPct(key, p)
          const color = status ? STATUS_COLOR[status] : '#9ca3af'

          // Para fibra con metas diarias, mostrar % del diario en vez de % de calorías
          const displayPct = dailyMacros && dailyMacros[key] && grams != null
            ? `${Math.round((grams / dailyMacros[key]) * 100)}%`
            : p != null ? `${p}%` : '—'

          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <div
                className="w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center"
                style={{ borderColor: color }}
              >
                <span className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                  {grams != null ? `${grams}g` : '—'}
                </span>
                <span className="text-xs font-semibold leading-none mt-0.5" style={{ color }}>
                  {displayPct}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 text-center leading-tight font-medium">
                {t(labelKey)}
              </span>
              {dailyMacros?.[key] && (
                <span className="text-[9px] text-gray-300 dark:text-gray-600">
                  /{dailyMacros[key]}g
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda + recomendación */}
      {macros && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 justify-center flex-wrap">
            {[['ok', 'OK'], ['warning', 'macro.legend_limit'], ['excess', 'macro.legend_excess'], ['low', 'macro.legend_low']].map(([s, labelKey]) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                <span className="text-[10px] text-gray-400">{s === 'ok' ? 'OK' : t(labelKey)}</span>
              </div>
            ))}
          </div>

          {recommendation && (
            <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
              recommendation === 'macro.balanced'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            }`}>
              <span className="flex-shrink-0 mt-0.5">
                {recommendation === 'macro.balanced' ? '✓' : '💡'}
              </span>
              <span className="leading-snug">
                {recommendation === 'macro.balanced' ? t(recommendation).replace('✓ ', '') : t(recommendation)}
              </span>
            </div>
          )}

          {dailyMacros && (
            <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center">
              {t('macro.daily_pct')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

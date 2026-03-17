import { useTranslation } from 'react-i18next'

const MACRO_CONFIG = [
  { key: 'fat_g',     labelKey: 'food.fat',     kcalPerG: 9 },
  { key: 'protein_g', labelKey: 'food.protein', kcalPerG: 4 },
  { key: 'carbs_g',   labelKey: 'food.carbs',   kcalPerG: 4 },
  { key: 'fiber_g',   labelKey: 'food.fiber',   kcalPerG: 2 },
]

// Semáforo nutricional por macro
// Devuelve color hex según si el valor está en rango saludable, límite o exceso
function getMacroColor(key, grams, pct) {
  if (grams == null || pct == null) return '#9ca3af' // gris si no hay datos

  switch (key) {
    case 'fat_g':
      // Grasas: ideal 20-35% de calorías
      if (pct <= 35) return '#22c55e'   // verde — OK
      if (pct <= 45) return '#f59e0b'   // amarillo — límite
      return '#ef4444'                  // rojo — exceso

    case 'protein_g':
      // Proteínas: ideal 15-35% de calorías
      if (pct >= 15) return '#22c55e'   // verde — bien (más proteína = mejor saciedad)
      if (pct >= 10) return '#f59e0b'   // amarillo — bajo
      return '#ef4444'                  // rojo — muy bajo

    case 'carbs_g':
      // Carbohidratos: ideal 40-65% de calorías
      if (pct >= 40 && pct <= 65) return '#22c55e'  // verde — OK
      if (pct > 65 && pct <= 75) return '#f59e0b'   // amarillo — alto
      if (pct > 75) return '#ef4444'                 // rojo — exceso
      if (pct >= 30) return '#f59e0b'                // amarillo — bajo
      return '#ef4444'                               // rojo — muy bajo

    case 'fiber_g':
      // Fibra: por comida, ideal ≥7g
      if (grams >= 7) return '#22c55e'  // verde — excelente
      if (grams >= 3) return '#f59e0b'  // amarillo — aceptable
      return '#ef4444'                  // rojo — muy poca fibra

    default:
      return '#9ca3af'
  }
}

export function MacroResultCard({ imagePreview, description, calories, macros, onEdit }) {
  const { t } = useTranslation()

  const title = description?.split(' con ')?.[0]?.split(',')?.[0] || description || ''

  const totalMacroCals = macros
    ? MACRO_CONFIG.reduce((sum, m) => sum + (macros[m.key] || 0) * m.kcalPerG, 0)
    : 0

  const pct = (key, kcalPerG) =>
    macros && totalMacroCals > 0
      ? Math.round(((macros[key] || 0) * kcalPerG / totalMacroCals) * 100)
      : null

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
      </div>

      {/* Círculos de macros con semáforo */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {MACRO_CONFIG.map(({ key, labelKey, kcalPerG }) => {
          const grams = macros?.[key] ?? null
          const p = pct(key, kcalPerG)
          const color = getMacroColor(key, grams, p)
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
                  {p != null ? `${p}%` : '—'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 text-center leading-tight font-medium">
                {t(labelKey)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Leyenda semáforo */}
      {macros && (
        <div className="flex items-center gap-3 justify-center pt-1">
          {[['#22c55e', 'OK'], ['#f59e0b', 'Límite'], ['#ef4444', 'Exceso']].map(([c, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

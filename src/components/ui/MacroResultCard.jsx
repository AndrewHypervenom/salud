import { useTranslation } from 'react-i18next'

const MACRO_CONFIG = [
  { key: 'protein_g', labelKey: 'food.protein', kcalPerG: 4, color: '#60a5fa' },  // blue-400
  { key: 'carbs_g',   labelKey: 'food.carbs',   kcalPerG: 4, color: '#fbbf24' },  // amber-400
  { key: 'fat_g',     labelKey: 'food.fat',      kcalPerG: 9, color: '#f87171' },  // red-400
  { key: 'fiber_g',   labelKey: 'food.fiber',    kcalPerG: 2, color: '#34d399' },  // emerald-400
]

export function MacroResultCard({ imagePreview, description, calories, macros, onEdit }) {
  const { t } = useTranslation()

  const title = description?.split(' con ')?.[0]?.split(',')?.[0] || description || ''

  // Porcentajes basados en calorías aportadas por cada macro
  const totalMacroCals = macros
    ? MACRO_CONFIG.reduce((sum, m) => sum + (macros[m.key] || 0) * m.kcalPerG, 0)
    : 0

  const pct = (key, kcalPerG) =>
    macros && totalMacroCals > 0
      ? Math.round(((macros[key] || 0) * kcalPerG / totalMacroCals) * 100)
      : 0

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Imagen con gradiente + título superpuesto */}
      {imagePreview ? (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={imagePreview} alt="food" className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <p className="text-white font-bold text-lg leading-snug drop-shadow">{title}</p>
          </div>
        </div>
      ) : (
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</p>
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

      {/* Sección macros */}
      {macros && (
        <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">

          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
            {t('food.macros')}
          </p>

          {/* Barra segmentada — visual de distribución */}
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {MACRO_CONFIG.map(({ key, kcalPerG, color }) => {
              const p = pct(key, kcalPerG)
              return p > 0 ? (
                <div
                  key={key}
                  className="h-full transition-all duration-700 ease-out"
                  style={{ width: `${p}%`, backgroundColor: color }}
                />
              ) : null
            })}
          </div>

          {/* 4 columnas: punto · gramos · label · % */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {MACRO_CONFIG.map(({ key, labelKey, kcalPerG, color }) => {
              const grams = macros[key] ?? null
              const p = pct(key, kcalPerG)
              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  {/* Dot de color */}
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />

                  {/* Gramos */}
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                    {grams != null ? `${grams}g` : '—'}
                  </span>

                  {/* Label */}
                  <span className="text-[10px] text-gray-400 text-center leading-tight font-medium">
                    {t(labelKey)}
                  </span>

                  {/* Porcentaje */}
                  <span className="text-xs font-semibold" style={{ color }}>
                    {p}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Botón incorrecto */}
      <button
        type="button"
        onClick={onEdit}
        className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        ✏️ {t('food.incorrect')}
      </button>
    </div>
  )
}

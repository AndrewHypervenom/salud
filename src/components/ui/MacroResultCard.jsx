import { useTranslation } from 'react-i18next'

const MACRO_CONFIG = [
  { key: 'fat_g',     labelKey: 'food.fat',     kcalPerG: 9, color: '#34d399' }, // verde
  { key: 'protein_g', labelKey: 'food.protein', kcalPerG: 4, color: '#f87171' }, // rojo
  { key: 'carbs_g',   labelKey: 'food.carbs',   kcalPerG: 4, color: '#fbbf24' }, // ámbar
  { key: 'fiber_g',   labelKey: 'food.fiber',   kcalPerG: 2, color: '#60a5fa' }, // azul
]

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

      {/* Círculos de macros — siempre visibles */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {MACRO_CONFIG.map(({ key, labelKey, kcalPerG, color }) => {
          const grams = macros?.[key] ?? null
          const p = pct(key, kcalPerG)
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
    </div>
  )
}

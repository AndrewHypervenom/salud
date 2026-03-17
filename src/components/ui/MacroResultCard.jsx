import { useTranslation } from 'react-i18next'

const MACRO_CONFIG = [
  {
    key: 'protein_g',
    labelKey: 'food.protein',
    kcalPerG: 4,
    icon: '💪',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  {
    key: 'carbs_g',
    labelKey: 'food.carbs',
    kcalPerG: 4,
    icon: '⚡',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  {
    key: 'fat_g',
    labelKey: 'food.fat',
    kcalPerG: 9,
    icon: '🫧',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-500',
    ring: 'ring-rose-200 dark:ring-rose-800',
  },
  {
    key: 'fiber_g',
    labelKey: 'food.fiber',
    kcalPerG: 2,
    icon: '🥦',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
]

export function MacroResultCard({ imagePreview, description, calories, macros, onEdit }) {
  const { t } = useTranslation()

  // Calorías por macro para calcular porcentajes
  const totalMacroCals = macros
    ? MACRO_CONFIG.reduce((sum, m) => sum + (macros[m.key] || 0) * m.kcalPerG, 0)
    : 0

  const getPct = (key, kcalPerG) => {
    if (!macros || !totalMacroCals) return 0
    return Math.round(((macros[key] || 0) * kcalPerG / totalMacroCals) * 100)
  }

  // Título: primera parte de la descripción
  const title = description?.split(' con ')?.[0]?.split(',')?.[0] || description || ''

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Imagen con gradiente + título superpuesto */}
      {imagePreview ? (
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img
            src={imagePreview}
            alt="food"
            className="w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
            <p className="text-white font-bold text-lg leading-snug drop-shadow-md">{title}</p>
          </div>
        </div>
      ) : (
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</p>
      )}

      {/* Descripción */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      )}

      {/* Card de calorías */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl p-4 text-center shadow-lg shadow-primary-500/30">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }}
        />
        <p className="text-xs text-white/70 uppercase tracking-widest font-semibold mb-1">
          Calorías totales
        </p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-5xl font-black text-white drop-shadow">
            {calories ?? '—'}
          </span>
          <span className="text-xl text-white/80 font-medium">kcal</span>
        </div>
      </div>

      {/* Grid de macros */}
      {macros && (
        <>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold -mb-1">
            {t('food.macros')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MACRO_CONFIG.map(({ key, labelKey, kcalPerG, icon, bg, text, bar, ring }) => {
              const grams = macros[key] ?? null
              const pct = getPct(key, kcalPerG)

              return (
                <div
                  key={key}
                  className={`${bg} ring-1 ${ring} rounded-2xl p-3.5 flex flex-col gap-2.5`}
                >
                  {/* Ícono + porcentaje */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${text}`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Gramos + label */}
                  <div>
                    <p className={`text-3xl font-black leading-none ${text}`}>
                      {grams != null ? `${grams}` : '—'}
                      <span className="text-lg font-semibold">g</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      {t(labelKey)}
                    </p>
                  </div>

                  {/* Barra de progreso */}
                  <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar} transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Botón "Es incorrecto" */}
      <button
        type="button"
        onClick={onEdit}
        className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        ✏️ {t('food.incorrect')}
      </button>
    </div>
  )
}

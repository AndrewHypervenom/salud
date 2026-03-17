import { useTranslation } from 'react-i18next'

const MACRO_PILLS = [
  { key: 'fat_g',     labelKey: 'food.fat',     bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-700 dark:text-amber-300' },
  { key: 'protein_g', labelKey: 'food.protein', bg: 'bg-blue-100 dark:bg-blue-900/40',     text: 'text-blue-700 dark:text-blue-300' },
  { key: 'carbs_g',   labelKey: 'food.carbs',   bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300' },
  { key: 'fiber_g',   labelKey: 'food.fiber',   bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
]

export function MacroResultCard({ imagePreview, description, calories, macros, onEdit }) {
  const { t } = useTranslation()

  const title = description?.split(' con ')?.[0]?.split(',')[0] || description || ''

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">
      {imagePreview && (
        <img
          src={imagePreview}
          alt="food"
          className="w-full max-h-52 object-cover rounded-2xl"
        />
      )}

      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{title}</p>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{description}</p>
      )}

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">
          {calories ?? '—'}
        </span>
        <span className="text-base text-gray-500 dark:text-gray-400 font-medium">kcal</span>
      </div>

      {macros && (
        <div className="grid grid-cols-4 gap-2">
          {MACRO_PILLS.map(({ key, labelKey, bg, text }) => (
            <div
              key={key}
              className={`${bg} ${text} rounded-xl py-2 px-1 flex flex-col items-center`}
            >
              <span className="font-bold text-sm leading-none">
                {macros[key] != null ? `${macros[key]}g` : '—'}
              </span>
              <span className="text-[10px] mt-0.5 text-center leading-tight opacity-80">
                {t(labelKey)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onEdit}
        className="w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {t('food.incorrect')}
      </button>
    </div>
  )
}

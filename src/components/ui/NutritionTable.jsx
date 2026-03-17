import { useTranslation } from 'react-i18next'

/**
 * NutritionTable — tabla de valores nutricionales
 * Props: items (array), dailyRef (object with kcal/protein/carbs/fat for RDI%)
 */
export function NutritionTable({ items = [], dailyRef = null, className = '' }) {
  const { t } = useTranslation()
  if (!items.length) return null

  const refKcal = dailyRef?.calories || 2000
  const refProtein = dailyRef?.protein_g || 50
  const refCarbs = dailyRef?.carbs_g || 250
  const refFat = dailyRef?.fat_g || 65

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 pr-2 font-semibold text-gray-600 dark:text-gray-300">{t('food_search.food_name')}</th>
            <th className="text-right py-2 px-1 font-semibold text-gray-600 dark:text-gray-300">{t('food_search.serving')}</th>
            <th className="text-right py-2 px-1 font-semibold text-gray-600 dark:text-gray-300">kcal</th>
            <th className="text-right py-2 px-1 font-semibold text-blue-500">P(g)</th>
            <th className="text-right py-2 px-1 font-semibold text-green-500">C(g)</th>
            <th className="text-right py-2 px-1 font-semibold text-amber-500">G(g)</th>
            {dailyRef && <th className="text-right py-2 pl-1 font-semibold text-gray-400">RDI%</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const rdi = dailyRef
              ? Math.round(((item.calories || 0) / refKcal) * 100)
              : null
            return (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-2 text-gray-800 dark:text-gray-200 font-medium leading-tight">
                  {item.name}
                  {item.brand && <span className="text-gray-400 font-normal"> · {item.brand}</span>}
                </td>
                <td className="text-right py-2 px-1 text-gray-500">{item.serving_size || '100g'}</td>
                <td className="text-right py-2 px-1 font-semibold text-gray-800 dark:text-gray-200">{item.calories || '-'}</td>
                <td className="text-right py-2 px-1 text-blue-500">{item.protein_g ?? '-'}</td>
                <td className="text-right py-2 px-1 text-green-500">{item.carbs_g ?? '-'}</td>
                <td className="text-right py-2 px-1 text-amber-500">{item.fat_g ?? '-'}</td>
                {dailyRef && <td className="text-right py-2 pl-1 text-gray-400">{rdi}%</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

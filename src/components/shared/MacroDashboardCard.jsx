import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { calcMacros } from '../../lib/formulas'

function MacroBar({ label, value, max, color, unit = 'g' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = max > 0 && value > max
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className={`font-medium ${color}`}>{label}</span>
        <span className="text-gray-500">
          <span className={over ? 'text-red-500 font-semibold' : 'text-gray-700 dark:text-gray-300 font-semibold'}>
            {value ?? 0}
          </span>
          <span className="text-gray-400"> / {max}{unit}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MacroDashboardCard({ calTarget, todayLogs = [] }) {
  const { t } = useTranslation()
  if (!calTarget) return null

  const macroGoals = calcMacros(calTarget)
  const totals = todayLogs.reduce(
    (acc, log) => ({
      protein: acc.protein + (log.protein_g || 0),
      carbs: acc.carbs + (log.carbs_g || 0),
      fat: acc.fat + (log.fat_g || 0),
      fiber: acc.fiber + (log.fiber_g || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )

  const hasMacroData = todayLogs.some(l => l.protein_g || l.carbs_g || l.fat_g)

  if (!hasMacroData) return null

  return (
    <Card>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('food.macros')}</p>
      <div className="flex flex-col gap-3">
        <MacroBar
          label={t('food.protein')}
          value={Math.round(totals.protein)}
          max={macroGoals.protein_g}
          color="text-blue-500"
        />
        <MacroBar
          label={t('food.carbs')}
          value={Math.round(totals.carbs)}
          max={macroGoals.carbs_g}
          color="text-green-500"
        />
        <MacroBar
          label={t('food.fat')}
          value={Math.round(totals.fat)}
          max={macroGoals.fat_g}
          color="text-amber-500"
        />
        {totals.fiber > 0 && (
          <MacroBar
            label={t('food.fiber')}
            value={Math.round(totals.fiber)}
            max={25}
            color="text-emerald-500"
          />
        )}
      </div>
    </Card>
  )
}

import { useTranslation } from 'react-i18next'

/**
 * WeightChart — SVG line chart for weight history
 * Props:
 *   logs          - array of {logged_date, weight_kg} (manual logs)
 *   estimatedLogs - array of {date, weight_kg} (AI estimated series)
 *   targetWeight  - number|null
 *   height        - number
 */
export function WeightChart({ logs = [], estimatedLogs = [], targetWeight = null, height = 160, className = '' }) {
  const { t } = useTranslation()

  if (logs.length === 0 && estimatedLogs.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-400 text-sm ${className}`} style={{ height }}>
        {t('weight.no_data')}
      </div>
    )
  }

  // Sort ascending for chart
  const sorted = [...logs].sort((a, b) => a.logged_date.localeCompare(b.logged_date))
  const estimatedSorted = [...estimatedLogs].sort((a, b) => a.date.localeCompare(b.date))

  const weights = sorted.map(l => l.weight_kg)
  const estimatedWeights = estimatedSorted.map(l => l.weight_kg)

  const allValues = [...weights, ...estimatedWeights, targetWeight].filter(v => v != null && !isNaN(v))
  const minW = Math.min(...allValues) - 1
  const maxW = Math.max(...allValues) + 1
  const range = maxW - minW || 1

  const W = 320
  const H = height
  const PAD = { top: 10, right: 16, bottom: 28, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  // Unified date axis — includes both manual and estimated dates
  const allDates = [...new Set([
    ...sorted.map(l => l.logged_date),
    ...estimatedSorted.map(l => l.date),
  ])].sort()

  const toXByDate = (date) => {
    const idx = allDates.indexOf(date)
    return PAD.left + (idx / Math.max(allDates.length - 1, 1)) * chartW
  }
  const toY = (w) => PAD.top + (1 - (w - minW) / range) * chartH

  // Build polyline points using date-based X
  const points = sorted.map(l => `${toXByDate(l.logged_date)},${toY(l.weight_kg)}`).join(' ')
  const estimatedPoints = estimatedSorted.map(l => `${toXByDate(l.date)},${toY(l.weight_kg)}`).join(' ')

  // Target line Y
  const targetY = targetWeight ? toY(targetWeight) : null

  // Y-axis ticks
  const tickCount = 4
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = minW + (range * i) / tickCount
    return { val: Math.round(val * 10) / 10, y: toY(val) }
  })

  // X-axis labels (first, middle, last) from all dates
  const xLabels = allDates.length <= 6
    ? allDates.map(d => ({ label: d.slice(5), x: toXByDate(d) }))
    : [
        { label: allDates[0].slice(5), x: toXByDate(allDates[0]) },
        { label: allDates[Math.floor(allDates.length / 2)].slice(5), x: toXByDate(allDates[Math.floor(allDates.length / 2)]) },
        { label: allDates[allDates.length - 1].slice(5), x: toXByDate(allDates[allDates.length - 1]) },
      ]

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={tick.y} x2={W - PAD.right} y2={tick.y}
              stroke="currentColor" strokeWidth="0.5"
              className="text-gray-200 dark:text-gray-700"
              strokeDasharray="4,4"
            />
            <text x={PAD.left - 4} y={tick.y + 4} textAnchor="end" fontSize="10"
              className="fill-gray-400">{tick.val}</text>
          </g>
        ))}

        {/* Target weight line */}
        {targetY !== null && (
          <>
            <line
              x1={PAD.left} y1={targetY} x2={W - PAD.right} y2={targetY}
              stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7"
            />
            <text x={W - PAD.right + 4} y={targetY + 4} fontSize="9" fill="#22c55e">
              {t('weight.goal_label')}
            </text>
          </>
        )}

        {/* Estimated weight line (blue dashed) */}
        {estimatedSorted.length > 0 && (
          <polyline
            points={estimatedPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="5,3"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}

        {/* Real weight line (green solid) */}
        {sorted.length > 0 && (
          <polyline
            points={points}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Dots for real weight */}
        {sorted.map((l, i) => (
          <circle
            key={l.id || i}
            cx={toXByDate(l.logged_date)} cy={toY(l.weight_kg)} r="3"
            fill="#16a34a" stroke="white" strokeWidth="1.5"
          />
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text key={i} x={label.x} y={H - 4} textAnchor="middle" fontSize="9"
            className="fill-gray-400">
            {label.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        {sorted.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-block w-4 h-0.5 bg-green-600 rounded" />
            {t('weight.legend_real')}
          </span>
        )}
        {estimatedSorted.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-block w-4 border-t-2 border-dashed border-blue-500" />
            {t('weight.legend_estimated')}
          </span>
        )}
        {targetWeight && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-block w-4 border-t-2 border-dashed border-green-500" />
            {t('weight.legend_goal')}
          </span>
        )}
      </div>
    </div>
  )
}

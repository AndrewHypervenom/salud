import { useTranslation } from 'react-i18next'

/**
 * WeightChart — SVG line chart for weight history
 * Props: logs (array of {logged_date, weight_kg}), targetWeight (number|null)
 */
export function WeightChart({ logs = [], targetWeight = null, height = 160, className = '' }) {
  const { t } = useTranslation()

  if (logs.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-400 text-sm ${className}`} style={{ height }}>
        {t('weight.no_data')}
      </div>
    )
  }

  // Sort ascending for chart
  const sorted = [...logs].sort((a, b) => a.logged_date.localeCompare(b.logged_date))
  const weights = sorted.map(l => l.weight_kg)

  const allValues = targetWeight ? [...weights, targetWeight] : weights
  const minW = Math.min(...allValues) - 1
  const maxW = Math.max(...allValues) + 1
  const range = maxW - minW || 1

  const W = 320
  const H = height
  const PAD = { top: 10, right: 16, bottom: 28, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const toX = (i) => PAD.left + (i / Math.max(sorted.length - 1, 1)) * chartW
  const toY = (w) => PAD.top + (1 - (w - minW) / range) * chartH

  // Build polyline points
  const points = sorted.map((l, i) => `${toX(i)},${toY(l.weight_kg)}`).join(' ')

  // Target line Y
  const targetY = targetWeight ? toY(targetWeight) : null

  // Y-axis ticks
  const tickCount = 4
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = minW + (range * i) / tickCount
    return { val: Math.round(val * 10) / 10, y: toY(val) }
  })

  // X-axis labels (first, middle, last)
  const xLabels = sorted.length <= 6
    ? sorted.map((l, i) => ({ label: l.logged_date.slice(5), x: toX(i) }))
    : [
        { label: sorted[0].logged_date.slice(5), x: toX(0) },
        { label: sorted[Math.floor(sorted.length / 2)].logged_date.slice(5), x: toX(Math.floor(sorted.length / 2)) },
        { label: sorted[sorted.length - 1].logged_date.slice(5), x: toX(sorted.length - 1) },
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

        {/* Weight line */}
        <polyline
          points={points}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {sorted.map((l, i) => (
          <circle
            key={l.id || i}
            cx={toX(i)} cy={toY(l.weight_kg)} r="3"
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
    </div>
  )
}

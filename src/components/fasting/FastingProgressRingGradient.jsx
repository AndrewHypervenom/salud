import { FASTING_PHASES } from './fastingPhases'

/**
 * FastingProgressRingGradient
 * Like ProgressRing but with a phase-colored gradient stroke + glow pulse.
 */
export default function FastingProgressRingGradient({
  percent = 0,
  size = 200,
  strokeWidth = 16,
  phaseIndex = 0,
  children,
}) {
  const phase = FASTING_PHASES[phaseIndex] ?? FASTING_PHASES[0]
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedPercent = Math.min(percent, 100)
  const offset = circumference - (clampedPercent / 100) * circumference
  const gradId = `fasting-grad-${phaseIndex}`
  const trackGradId = `fasting-track-${phaseIndex}`

  // Cap dot position at end of arc
  const progressAngle = ((clampedPercent / 100) * 360 - 90) * (Math.PI / 180)
  const capX = size / 2 + radius * Math.cos(progressAngle)
  const capY = size / 2 + radius * Math.sin(progressAngle)

  return (
    <div
      className="relative inline-flex items-center justify-center animate-phase-glow-pulse"
      style={{
        width: size,
        height: size,
        '--phase-color': phase.primary,
      }}
    >
      <svg width={size} height={size} className="-rotate-90" overflow="visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={phase.glow} stopOpacity="0.9" />
            <stop offset="50%" stopColor={phase.primary} />
            <stop offset="100%" stopColor={phase.darkPrimary ?? phase.primary} />
          </linearGradient>
          <linearGradient id={trackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={phase.primary} stopOpacity="0.06" />
            <stop offset="100%" stopColor={phase.primary} stopOpacity="0.14" />
          </linearGradient>
        </defs>

        {/* Track ring — sutil */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${trackGradId})`}
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 1.4s ease',
            filter: `drop-shadow(0 0 ${Math.round(strokeWidth / 2)}px ${phase.primary}60)`,
          }}
        />

        {/* Cap dot pulsante al final del arco */}
        {clampedPercent > 1 && clampedPercent < 100 && (
          <circle
            cx={capX}
            cy={capY}
            r={strokeWidth / 2 + 1}
            fill={phase.primary}
            className="animate-phase-glow-pulse"
          />
        )}
      </svg>

      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

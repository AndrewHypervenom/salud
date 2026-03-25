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
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const gradId = `fasting-grad-${phaseIndex}`

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
            <stop offset="0%" stopColor={phase.glow} />
            <stop offset="100%" stopColor={phase.primary} />
          </linearGradient>
        </defs>

        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={phase.glow}
          strokeWidth={strokeWidth}
          opacity={0.25}
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
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 1.2s ease' }}
        />
      </svg>

      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

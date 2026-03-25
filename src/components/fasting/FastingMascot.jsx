import { FASTING_PHASES } from './fastingPhases'

// Inline SVG Tamagotchi mascot
// States: sleeping | neutral | tired | energized | radiant | cosmic
// Reactions: idle | dancing | waving

export default function FastingMascot({ phaseIndex = 0, reaction = 'idle', sleeping = false }) {
  const phase = FASTING_PHASES[phaseIndex] ?? FASTING_PHASES[0]
  const state = sleeping ? 'sleeping' : phase.mascotState

  const bodyColor = phase.primary
  const glowColor = phase.glow

  const animClass = reaction === 'dancing'
    ? 'animate-mascot-dance'
    : reaction === 'waving'
      ? 'animate-mascot-wave'
      : 'animate-mascot-breathe'

  return (
    <div className="flex items-center justify-center relative" style={{ width: 96, height: 96 }}>
      {/* Glow aura behind mascot */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 72,
          height: 72,
          background: `radial-gradient(circle, ${glowColor}88 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <svg
        viewBox="0 0 80 80"
        width={80}
        height={80}
        className={animClass}
        style={{ transition: 'all 0.6s ease', position: 'relative', zIndex: 1 }}
      >
        {/* ── Body ── */}
        <rect
          x="12" y="16" width="56" height="52" rx="22"
          style={{ fill: bodyColor, transition: 'fill 1.2s ease' }}
        />

        {/* ── Cheeks (energized / radiant / cosmic) ── */}
        {(state === 'energized' || state === 'radiant' || state === 'cosmic') && (
          <>
            <ellipse cx="20" cy="48" rx="6" ry="4" fill="#FF6B9D" opacity="0.45" />
            <ellipse cx="60" cy="48" rx="6" ry="4" fill="#FF6B9D" opacity="0.45" />
          </>
        )}

        {/* ── Eyes ── */}
        <Eyes state={state} glowColor={glowColor} />

        {/* ── Mouth ── */}
        <Mouth state={state} />

        {/* ── Phase accessories ── */}
        <Accessory state={state} phase={phaseIndex} bodyColor={bodyColor} glowColor={glowColor} />

        {/* ── Sleeping ZZZ ── */}
        {state === 'sleeping' && <SleepingZZZ />}
      </svg>
    </div>
  )
}

function Eyes({ state, glowColor }) {
  if (state === 'sleeping') {
    return (
      <g>
        {/* Closed eyes — curved lines */}
        <path d="M 25 36 Q 29 33 33 36" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 47 36 Q 51 33 55 36" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    )
  }

  if (state === 'tired') {
    return (
      <g>
        {/* Half-open eyes */}
        <ellipse cx="29" cy="35" rx="5" ry="3" fill="white" />
        <ellipse cx="29" cy="36" rx="3" ry="2" fill="#1f2937" />
        <ellipse cx="51" cy="35" rx="5" ry="3" fill="white" />
        <ellipse cx="51" cy="36" rx="3" ry="2" fill="#1f2937" />
      </g>
    )
  }

  if (state === 'cosmic') {
    return (
      <g>
        {/* Star eyes */}
        <circle cx="29" cy="35" r="6" fill="white" />
        <StarShape cx={29} cy={35} r={4} fill={glowColor} />
        <circle cx="51" cy="35" r="6" fill="white" />
        <StarShape cx={51} cy={35} r={4} fill={glowColor} />
        {/* Outer glow ring */}
        <circle cx="29" cy="35" r="7.5" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="0.6" />
        <circle cx="51" cy="35" r="7.5" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="0.6" />
      </g>
    )
  }

  // Normal / energized / radiant
  return (
    <g>
      <circle cx="29" cy="35" r="6" fill="white" />
      <circle cx="29" cy="35" r="3.5" fill="#1f2937" />
      <circle cx="30.5" cy="33.5" r="1.2" fill="white" />

      <circle cx="51" cy="35" r="6" fill="white" />
      <circle cx="51" cy="35" r="3.5" fill="#1f2937" />
      <circle cx="52.5" cy="33.5" r="1.2" fill="white" />

      {state === 'radiant' && (
        <>
          <circle cx="29" cy="35" r="7.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <circle cx="51" cy="35" r="7.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
        </>
      )}
    </g>
  )
}

function Mouth({ state }) {
  const paths = {
    sleeping:  'M 28 50 Q 40 48 52 50',
    tired:     'M 28 50 Q 40 46 52 50',
    neutral:   'M 27 50 Q 40 55 53 50',
    energized: 'M 25 48 Q 40 58 55 48',
    radiant:   'M 24 48 Q 40 60 56 48',
    cosmic:    'M 24 47 Q 40 62 56 47',
  }
  const d = paths[state] ?? paths.neutral
  return (
    <path
      d={d}
      stroke="white"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      style={{ transition: 'd 0.6s ease' }}
    />
  )
}

function Accessory({ state, phase, bodyColor, glowColor }) {
  if (phase === 0) {
    // Fork + knife floating above head (phase 0: hunger)
    return (
      <g opacity="0.9">
        <line x1="37" y1="8" x2="37" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="8" x2="40" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="43" y1="8" x2="43" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="11" x2="40" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    )
  }

  if (phase === 2) {
    // Flame crown on top
    return (
      <g>
        <path d="M 37 12 Q 38 6 40 4 Q 42 6 43 12 Q 41 8 40 10 Q 39 8 37 12 Z"
          fill="#FCD34D" />
        <path d="M 39 13 Q 40 8 41 13 Z"
          fill="#F97316" opacity="0.8" />
      </g>
    )
  }

  if (phase === 3) {
    // Lightning bolt badge on chest
    return (
      <g>
        <polygon
          points="47,52 44,60 49,58 46,66 51,57 46,59"
          fill="white"
          opacity="0.95"
        />
      </g>
    )
  }

  if (phase === 4) {
    // Star halo
    return (
      <g>
        <StarShape cx={40} cy={9} r={5} fill="white" opacity={0.9} />
        <circle cx="40" cy="9" r="7" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="0.7" />
      </g>
    )
  }

  return null
}

function StarShape({ cx, cy, r, fill, opacity = 1 }) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.45
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`
  }).join(' ')
  return <polygon points={points} fill={fill} opacity={opacity} />
}

function SleepingZZZ() {
  return (
    <g className="animate-float-zz" style={{ transformOrigin: '60px 10px' }}>
      <text x="58" y="14" fontSize="8" fill="white" fontWeight="bold" opacity="0.9">z</text>
      <text x="63" y="9" fontSize="6" fill="white" fontWeight="bold" opacity="0.7">z</text>
      <text x="67" y="5" fontSize="5" fill="white" fontWeight="bold" opacity="0.5">z</text>
    </g>
  )
}

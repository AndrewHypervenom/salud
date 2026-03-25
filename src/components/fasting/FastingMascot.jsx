import { FASTING_PHASES } from './fastingPhases'

/**
 * FastingMascot — cute SVG mascot (cat or dog)
 * Props: phaseIndex, reaction (idle|dancing|waving), sleeping, mascotType (cat|dog)
 */
export default function FastingMascot({
  phaseIndex = 0,
  reaction = 'idle',
  sleeping = false,
  mascotType = 'cat',
}) {
  const phase = FASTING_PHASES[phaseIndex] ?? FASTING_PHASES[0]
  const state = sleeping ? 'sleeping' : phase.mascotState
  const glowColor = phase.glow
  const primary = phase.primary
  const darkPrimary = phase.darkPrimary ?? phase.primary

  const animClass =
    reaction === 'dancing' ? 'animate-mascot-dance'
    : reaction === 'waving' ? 'animate-mascot-wave'
    : 'animate-mascot-breathe'

  return (
    <div className="flex items-center justify-center relative" style={{ width: 120, height: 120 }}>
      {/* Glow aura */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 92, height: 92,
          background: `radial-gradient(circle, ${glowColor}99 0%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <svg
        viewBox="0 0 80 80"
        width={108}
        height={108}
        className={animClass}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {mascotType === 'cat'
          ? <CatBody state={state} primary={primary} darkPrimary={darkPrimary} glowColor={glowColor} phaseIndex={phaseIndex} />
          : <DogBody state={state} primary={primary} darkPrimary={darkPrimary} glowColor={glowColor} phaseIndex={phaseIndex} />
        }
        {state === 'sleeping' && <ZZZ />}
      </svg>
    </div>
  )
}

/* ──────────────────────────────────────────
   SHARED DEFS (gradients + shadow)
────────────────────────────────────────── */
function MascotDefs({ primary, darkPrimary }) {
  return (
    <defs>
      <radialGradient id="bodyGrad" cx="35%" cy="28%" r="65%" fx="35%" fy="28%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="42%"  stopColor={primary} stopOpacity="1" />
        <stop offset="100%" stopColor={darkPrimary} stopOpacity="1" />
      </radialGradient>
      <radialGradient id="earGrad" cx="50%" cy="80%" r="80%">
        <stop offset="0%"   stopColor={primary} stopOpacity="1" />
        <stop offset="100%" stopColor={darkPrimary} stopOpacity="1" />
      </radialGradient>
      <filter id="bodyShad" x="-10%" y="-10%" width="130%" height="135%">
        <feDropShadow dx="2" dy="3.5" stdDeviation="3" floodColor="#000000" floodOpacity="0.22" />
      </filter>
    </defs>
  )
}

/* ──────────────────────────────────────────
   CAT MASCOT
────────────────────────────────────────── */
function CatBody({ state, primary, darkPrimary, glowColor, phaseIndex }) {
  const isHappy = state === 'energized' || state === 'radiant' || state === 'cosmic'

  return (
    <g>
      <MascotDefs primary={primary} darkPrimary={darkPrimary} />

      {/* ── Tail (behind body, drawn first) ── */}
      <path
        d="M 58,66 Q 72,68 70,54 Q 68,44 60,46"
        fill="none"
        stroke={primary}
        strokeWidth="6"
        strokeLinecap="round"
        style={{ transition: 'stroke 1.2s ease' }}
      />
      <path
        d="M 58,66 Q 72,68 70,54 Q 68,44 60,46"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* ── Ears ── */}
      {/* Left ear */}
      <polygon points="16,26 22,7 32,23" fill="url(#earGrad)" />
      <polygon points="18,24 23,11 30,21" fill="#FFB5D3" opacity="0.85" />
      {/* Right ear */}
      <polygon points="64,26 58,7 48,23" fill="url(#earGrad)" />
      <polygon points="62,24 57,11 50,21" fill="#FFB5D3" opacity="0.85" />

      {/* ── Body ── */}
      <rect
        x="13" y="22" width="54" height="48" rx="22"
        fill="url(#bodyGrad)"
        filter="url(#bodyShad)"
        style={{ transition: 'fill 1.2s ease' }}
      />

      {/* ── Belly patch ── */}
      <ellipse cx="40" cy="52" rx="16" ry="12" fill="white" opacity="0.2" />

      {/* ── Cheeks (siempre visibles, opacidad dinámica) ── */}
      <ellipse cx="19" cy="48" rx="6" ry="4" fill="#FF6B9D"
        opacity={isHappy ? 0.45 : 0.18}
        style={{ transition: 'opacity 0.6s ease' }}
      />
      <ellipse cx="61" cy="48" rx="6" ry="4" fill="#FF6B9D"
        opacity={isHappy ? 0.45 : 0.18}
        style={{ transition: 'opacity 0.6s ease' }}
      />

      {/* ── Eyes ── */}
      <CatEyes state={state} glowColor={glowColor} />

      {/* ── Nose ── */}
      <CatNose state={state} />

      {/* ── Whiskers ── */}
      <CatWhiskers state={state} />

      {/* ── Phase accessories ── */}
      <PhaseAccessory phaseIndex={phaseIndex} glowColor={glowColor} />
    </g>
  )
}

function CatEyes({ state, glowColor }) {
  if (state === 'sleeping') {
    return (
      <g>
        {/* Cute curved closed eyes */}
        <path d="M 24,36 Q 28,32 32,36" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 48,36 Q 52,32 56,36" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (state === 'tired') {
    return (
      <g>
        <ellipse cx="28" cy="36" rx="6" ry="4" fill="white" />
        <ellipse cx="28" cy="37" rx="2" ry="3" fill="#1f2937" />
        <ellipse cx="52" cy="36" rx="6" ry="4" fill="white" />
        <ellipse cx="52" cy="37" rx="2" ry="3" fill="#1f2937" />
        {/* Droopy eyelid */}
        <path d="M 22,34 Q 28,30 34,34" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M 46,34 Q 52,30 58,34" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
      </g>
    )
  }
  if (state === 'cosmic') {
    return (
      <g>
        <ellipse cx="28" cy="36" rx="7" ry="6" fill="white" />
        <StarPupil cx={28} cy={36} r={4} fill={glowColor} />
        <ellipse cx="52" cy="36" rx="7" ry="6" fill="white" />
        <StarPupil cx={52} cy={36} r={4} fill={glowColor} />
        <circle cx="28" cy="36" r="8.5" fill="none" stroke={glowColor} strokeWidth="1.2" opacity="0.5" />
        <circle cx="52" cy="36" r="8.5" fill="none" stroke={glowColor} strokeWidth="1.2" opacity="0.5" />
      </g>
    )
  }
  // Normal / energized / radiant — cat eyes with vertical slit pupil
  return (
    <g>
      <ellipse cx="28" cy="36" rx="8" ry="7" fill="white" />
      {/* Vertical slit pupil */}
      <ellipse cx="28" cy="36" rx={state === 'energized' || state === 'radiant' ? 2.5 : 2} ry="4.5" fill="#1f2937" />
      <circle cx="29.5" cy="34" r="1.6" fill="white" />
      <circle cx="26.5" cy="37.5" r="0.7" fill="white" opacity="0.45" />

      <ellipse cx="52" cy="36" rx="8" ry="7" fill="white" />
      <ellipse cx="52" cy="36" rx={state === 'energized' || state === 'radiant' ? 2.5 : 2} ry="4.5" fill="#1f2937" />
      <circle cx="53.5" cy="34" r="1.6" fill="white" />
      <circle cx="50.5" cy="37.5" r="0.7" fill="white" opacity="0.45" />

      {state === 'radiant' && (
        <>
          <circle cx="28" cy="36" r="8.5" fill="none" stroke="white" strokeWidth="1.2" opacity="0.4" />
          <circle cx="52" cy="36" r="8.5" fill="none" stroke="white" strokeWidth="1.2" opacity="0.4" />
        </>
      )}
    </g>
  )
}

function CatNose({ state }) {
  if (state === 'sleeping') return null
  return (
    <g>
      {/* Tiny cute triangle nose */}
      <polygon points="37,47 43,47 40,51" fill="#FFB5D3" opacity="0.95" />
      <circle cx="38.5" cy="47.5" r="0.8" fill="white" opacity="0.6" />
      {/* Mouth — Y shape */}
      <path d="M 40,51 Q 36,55 33,54" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M 40,51 Q 44,55 47,54" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  )
}

function CatWhiskers({ state }) {
  if (state === 'sleeping') return null
  return (
    <g opacity="0.75">
      {/* Left whiskers */}
      <line x1="7" y1="44" x2="24" y2="46" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7" y1="48" x2="24" y2="48" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7" y1="52" x2="24" y2="50" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      {/* Right whiskers */}
      <line x1="73" y1="44" x2="56" y2="46" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="73" y1="48" x2="56" y2="48" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="73" y1="52" x2="56" y2="50" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

/* ──────────────────────────────────────────
   DOG MASCOT
────────────────────────────────────────── */
function DogBody({ state, primary, darkPrimary, glowColor, phaseIndex }) {
  const isHappy = state === 'energized' || state === 'radiant' || state === 'cosmic'

  return (
    <g>
      <MascotDefs primary={primary} darkPrimary={darkPrimary} />

      {/* ── Floppy ears (behind body) ── */}
      <ellipse cx="10" cy="38" rx="10" ry="20"
        fill="url(#earGrad)"
        opacity="0.9"
      />
      {/* Ear inner shadow */}
      <ellipse cx="10" cy="40" rx="6" ry="14" fill="white" opacity="0.15" />

      <ellipse cx="70" cy="38" rx="10" ry="20"
        fill="url(#earGrad)"
        opacity="0.9"
      />
      <ellipse cx="70" cy="40" rx="6" ry="14" fill="white" opacity="0.15" />

      {/* ── Body ── */}
      <rect
        x="14" y="18" width="52" height="52" rx="22"
        fill="url(#bodyGrad)"
        filter="url(#bodyShad)"
        style={{ transition: 'fill 1.2s ease' }}
      />

      {/* ── Belly patch ── */}
      <ellipse cx="40" cy="54" rx="16" ry="11" fill="white" opacity="0.22" />

      {/* ── Cheeks (always visible on dog) ── */}
      <ellipse cx="20" cy="49" rx="7" ry="5" fill="#FF9EBB"
        opacity={isHappy ? 0.5 : 0.25}
        style={{ transition: 'opacity 0.6s ease' }}
      />
      <ellipse cx="60" cy="49" rx="7" ry="5" fill="#FF9EBB"
        opacity={isHappy ? 0.5 : 0.25}
        style={{ transition: 'opacity 0.6s ease' }}
      />

      {/* ── Eyes ── */}
      <DogEyes state={state} glowColor={glowColor} />

      {/* ── Nose ── */}
      <DogNose state={state} />

      {/* ── Tongue (happy) ── */}
      {isHappy && <DogTongue state={state} />}

      {/* ── Phase accessories ── */}
      <PhaseAccessory phaseIndex={phaseIndex} glowColor={glowColor} />
    </g>
  )
}

function DogEyes({ state, glowColor }) {
  if (state === 'sleeping') {
    return (
      <g>
        <path d="M 22,35 Q 27,30 32,35" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 48,35 Q 53,30 58,35" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (state === 'tired') {
    return (
      <g>
        <circle cx="27" cy="35" r="7" fill="white" />
        <circle cx="27" cy="36" r="4" fill="#2d1b05" />
        <circle cx="29" cy="34" r="1.5" fill="white" />
        <path d="M 20,31 Q 27,27 34,31" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />

        <circle cx="53" cy="35" r="7" fill="white" />
        <circle cx="53" cy="36" r="4" fill="#2d1b05" />
        <circle cx="55" cy="34" r="1.5" fill="white" />
        <path d="M 46,31 Q 53,27 60,31" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
      </g>
    )
  }
  if (state === 'cosmic') {
    return (
      <g>
        <circle cx="27" cy="34" r="8" fill="white" />
        <StarPupil cx={27} cy={34} r={5} fill={glowColor} />
        <circle cx="27" cy="34" r="9.5" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="0.5" />

        <circle cx="53" cy="34" r="8" fill="white" />
        <StarPupil cx={53} cy={34} r={5} fill={glowColor} />
        <circle cx="53" cy="34" r="9.5" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="0.5" />
      </g>
    )
  }
  // Normal / energized / radiant — big cute dog eyes
  const pupilSize = state === 'energized' ? 5 : state === 'radiant' ? 5.5 : 4.5
  return (
    <g>
      <circle cx="27" cy="34" r="9" fill="white" />
      <circle cx="27" cy="34" r={pupilSize} fill="#2d1b05" />
      <circle cx="29" cy="32" r="1.8" fill="white" />
      <circle cx="26" cy="33" r="0.8" fill="white" opacity="0.6" />
      <circle cx="26" cy="36.5" r="0.6" fill="white" opacity="0.4" />

      <circle cx="53" cy="34" r="9" fill="white" />
      <circle cx="53" cy="34" r={pupilSize} fill="#2d1b05" />
      <circle cx="55" cy="32" r="1.8" fill="white" />
      <circle cx="52" cy="33" r="0.8" fill="white" opacity="0.6" />
      <circle cx="52" cy="36.5" r="0.6" fill="white" opacity="0.4" />

      {state === 'radiant' && (
        <>
          <circle cx="27" cy="34" r="9.5" fill="none" stroke="white" strokeWidth="1.2" opacity="0.4" />
          <circle cx="53" cy="34" r="9.5" fill="none" stroke="white" strokeWidth="1.2" opacity="0.4" />
        </>
      )}
    </g>
  )
}

function DogNose({ state }) {
  if (state === 'sleeping') {
    // Small cute sleeping nose
    return (
      <ellipse cx="40" cy="50" rx="6" ry="4" fill="#2d1b05" opacity="0.8" />
    )
  }
  return (
    <g>
      {/* Big shiny dog nose */}
      <ellipse cx="40" cy="50" rx="9" ry="6" fill="#2d1b05" />
      <ellipse cx="37" cy="48" rx="3" ry="2" fill="white" opacity="0.3" />
      {/* Mouth curve */}
      <path d="M 40,56 Q 35,60 32,58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 40,56 Q 45,60 48,58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function DogTongue({ state }) {
  const yOffset = state === 'cosmic' ? 1 : 0
  return (
    <g>
      <rect x="36" y={60 + yOffset} width="8" height="9" rx="4"
        fill="#FF6B6B"
        opacity="0.95"
      />
      <line x1="40" y1={60 + yOffset} x2="40" y2={69 + yOffset}
        stroke="#e05555" strokeWidth="1" opacity="0.5"
      />
    </g>
  )
}

/* ──────────────────────────────────────────
   SHARED COMPONENTS
────────────────────────────────────────── */
function PhaseAccessory({ phaseIndex, glowColor }) {
  if (phaseIndex === 0) {
    // Phase 0: little fork above head
    return (
      <g opacity="0.85">
        <line x1="37" y1="7" x2="37" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="7" x2="40" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="43" y1="7" x2="43" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M 38,11 Q 40,13 42,11" stroke="white" strokeWidth="1.5" fill="none" />
      </g>
    )
  }
  if (phaseIndex === 2) {
    // Phase 2: flame crown
    return (
      <g>
        <path d="M 36,14 Q 37,6 40,3 Q 43,6 44,14 Q 42,8 40,11 Q 38,8 36,14 Z"
          fill="#FCD34D" />
        <path d="M 39,15 Q 40,8 41,15 Z" fill="#F97316" opacity="0.7" />
      </g>
    )
  }
  if (phaseIndex === 3) {
    // Phase 3: lightning bolt
    return (
      <g>
        <polygon
          points="43,52 40,61 45,58 42,67 48,57 43,60"
          fill="white" opacity="0.95"
        />
      </g>
    )
  }
  if (phaseIndex === 4) {
    // Phase 4: star halo
    return (
      <g>
        <StarPupil cx={40} cy={8} r={5} fill="white" opacity={0.9} />
        <circle cx="40" cy="8" r="7.5" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="0.65" />
      </g>
    )
  }
  return null
}

function StarPupil({ cx, cy, r, fill, opacity = 1 }) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.42
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`
  }).join(' ')
  return <polygon points={pts} fill={fill} opacity={opacity} />
}

function ZZZ() {
  return (
    <g className="animate-float-zz" style={{ transformOrigin: '60px 10px' }}>
      <text x="57" y="14" fontSize="9" fill="white" fontWeight="bold" opacity="0.9">z</text>
      <text x="63" y="8" fontSize="7" fill="white" fontWeight="bold" opacity="0.65">z</text>
      <text x="68" y="4" fontSize="5" fill="white" fontWeight="bold" opacity="0.4">z</text>
    </g>
  )
}

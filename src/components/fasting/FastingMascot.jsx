import { FASTING_PHASES } from './fastingPhases'

const MASCOT_EMOJI = {
  axolotl: '🐱',
  capybara: '🐶',
}

const STATE_ANIM = {
  sleeping:  'animate-emoji-sleeping',
  neutral:   'animate-emoji-neutral',
  tired:     'animate-emoji-tired',
  energized: 'animate-emoji-energized',
  radiant:   'animate-emoji-radiant',
  cosmic:    'animate-emoji-cosmic',
}

const REACTION_ANIM = {
  dancing: 'animate-mascot-dance',
  waving:  'animate-mascot-wave',
}

/**
 * FastingMascot — emoji mascot animated by CSS based on fasting phase/state
 * Props: phaseIndex, reaction (idle|dancing|waving), sleeping, mascotType (axolotl|capybara)
 */
export default function FastingMascot({
  phaseIndex = 0,
  reaction = 'idle',
  sleeping = false,
  mascotType = 'axolotl',
}) {
  const phase = FASTING_PHASES[phaseIndex] ?? FASTING_PHASES[0]
  const state = sleeping ? 'sleeping' : phase.mascotState
  const glowColor = phase.glow

  const effectiveMascot = mascotType === 'capybara' ? 'capybara' : 'axolotl'
  const emoji = MASCOT_EMOJI[effectiveMascot]

  const animClass = REACTION_ANIM[reaction] ?? STATE_ANIM[state] ?? 'animate-emoji-neutral'

  return (
    <div
      className="flex items-center justify-center relative"
      style={{ width: 220, height: 220 }}
    >
      {/* Glow aura */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 160, height: 160,
          background: `radial-gradient(circle, ${glowColor}88 0%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Emoji mascot */}
      <span
        className={animClass}
        style={{
          fontSize: 80,
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
          display: 'block',
          userSelect: 'none',
        }}
        role="img"
        aria-label={effectiveMascot}
      >
        {emoji}
      </span>

      {/* ZZZ sleeping overlay */}
      {state === 'sleeping' && (
        <div
          className="animate-float-zz absolute"
          style={{ top: 6, right: 14, zIndex: 2, pointerEvents: 'none', display: 'flex', gap: 2, alignItems: 'flex-end' }}
        >
          <span style={{ fontSize: 11, color: 'white', fontWeight: 700, opacity: 0.9 }}>z</span>
          <span style={{ fontSize: 9, color: 'white', fontWeight: 700, opacity: 0.65 }}>z</span>
          <span style={{ fontSize: 7, color: 'white', fontWeight: 700, opacity: 0.4 }}>z</span>
        </div>
      )}
    </div>
  )
}

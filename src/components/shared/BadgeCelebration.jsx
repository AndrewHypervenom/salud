import { useEffect, useState, useCallback } from 'react'
import { Trophy } from 'lucide-react'

// Colores vibrantes para el confetti
const CONFETTI_COLORS = [
  '#facc15', '#f97316', '#ec4899', '#8b5cf6',
  '#06b6d4', '#10b981', '#ef4444', '#3b82f6',
]

const DIFF_STYLES = {
  easy:   { bg: 'bg-green-100 dark:bg-green-900/40',   icon: 'text-green-500',   border: 'border-green-200 dark:border-green-700',   title: 'text-green-600 dark:text-green-400' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', icon: 'text-yellow-500',  border: 'border-yellow-200 dark:border-yellow-700',  title: 'text-yellow-600 dark:text-yellow-400' },
  hard:   { bg: 'bg-orange-100 dark:bg-orange-900/40', icon: 'text-orange-500',  border: 'border-orange-200 dark:border-orange-700',  title: 'text-orange-600 dark:text-orange-400' },
  elite:  { bg: 'bg-purple-100 dark:bg-purple-900/40', icon: 'text-purple-500',  border: 'border-purple-200 dark:border-purple-700',  title: 'text-purple-600 dark:text-purple-400' },
}

function ConfettiPiece({ color, style }) {
  return (
    <div
      className="absolute rounded-sm pointer-events-none"
      style={{
        backgroundColor: color,
        width: style.size,
        height: style.size * (Math.random() > 0.5 ? 1 : 2.5),
        left: `${style.x}%`,
        top: '-10px',
        opacity: 0,
        transform: `rotate(${style.rot}deg)`,
        animation: `confetti-fall ${style.dur}s ${style.delay}s ease-in forwards`,
      }}
    />
  )
}

function generateConfetti(count = 55) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    style: {
      x:     Math.random() * 100,
      size:  6 + Math.random() * 8,
      rot:   Math.random() * 360,
      dur:   2.2 + Math.random() * 1.8,
      delay: Math.random() * 0.8,
    },
  }))
}

export function BadgeCelebration({ badge, lang = 'es', onDismiss }) {
  const [confetti] = useState(() => generateConfetti())
  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onDismiss?.(), 350)
  }, [onDismiss])

  // Auto-dismiss after 5.5s
  useEffect(() => {
    const id = setTimeout(handleClose, 5500)
    return () => clearTimeout(id)
  }, [handleClose])

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  if (!badge) return null

  const label  = lang === 'es' ? badge.label_es  : badge.label_en
  const desc   = lang === 'es' ? badge.desc_es   : badge.desc_en
  const diff   = DIFF_STYLES[badge.difficulty] || DIFF_STYLES.easy
  const BadgeIcon = badge.Icon
  const titleText   = lang === 'es' ? '¡Logro desbloqueado!' : 'Achievement unlocked!'
  const tapToDismiss = lang === 'es' ? 'Toca para cerrar' : 'Tap to close'

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center
                  bg-black/60 backdrop-blur-sm
                  ${closing ? 'animate-fade-out' : 'animate-fade-in-backdrop'}`}
      onClick={handleClose}
      role="alertdialog"
      aria-live="assertive"
      aria-label={titleText}
    >
      {/* Confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {confetti.map(c => (
          <ConfettiPiece key={c.id} color={c.color} style={c.style} />
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative z-10 flex flex-col items-center gap-5 px-8 py-8
                    bg-white dark:bg-gray-900 rounded-3xl shadow-2xl
                    border-2 ${diff.border}
                    mx-4 max-w-sm w-full
                    ${closing ? 'animate-scale-out' : 'animate-celebration-pop'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sparkle ring behind icon */}
        <div className="relative">
          <div className={`absolute inset-0 rounded-full animate-pulse-ring-slow opacity-40 ${diff.bg}`}
               style={{ transform: 'scale(1.6)' }} aria-hidden="true" />
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${diff.bg} relative`}>
            {BadgeIcon
              ? <BadgeIcon size={40} strokeWidth={1.4} className={diff.icon} />
              : <Trophy size={40} strokeWidth={1.4} className="text-yellow-500" />
            }
          </div>
        </div>

        {/* Texts */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className={`text-xs font-bold uppercase tracking-widest ${diff.title}`}>
            {titleText}
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
            {label}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Dismiss hint */}
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{tapToDismiss}</p>
      </div>
    </div>
  )
}

// ── Global listener hook — used once in AppLayout ──────────────────────────
export function useBadgeCelebration() {
  const [celebrationBadge, setCelebrationBadge] = useState(null)

  useEffect(() => {
    const handler = (e) => setCelebrationBadge(e.detail)
    window.addEventListener('badge-unlocked', handler)
    return () => window.removeEventListener('badge-unlocked', handler)
  }, [])

  const dismiss = useCallback(() => setCelebrationBadge(null), [])

  return { celebrationBadge, dismiss }
}

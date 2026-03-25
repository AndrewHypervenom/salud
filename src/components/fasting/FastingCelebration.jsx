import { createPortal } from 'react-dom'

const COLORS = ['#F97316', '#EAB308', '#10B981', '#8B5CF6', '#6366F1', '#EC4899', '#F43F5E', '#06B6D4']

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * 2 * Math.PI
  const distance = 60 + Math.random() * 80
  return {
    id: i,
    tx: `${Math.round(Math.cos(angle) * distance)}px`,
    ty: `${Math.round(Math.sin(angle) * distance)}px`,
    color: COLORS[i % COLORS.length],
    size: 6 + (i % 3) * 3,
    delay: `${(i * 0.04).toFixed(2)}s`,
    shape: i % 3,
  }
})

export default function FastingCelebration({ visible }) {
  if (!visible) return null

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="absolute animate-burst-particle"
          style={{
            '--tx': p.tx,
            '--ty': p.ty,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '2px' : '50% 0',
            backgroundColor: p.color,
          }}
        />
      ))}

      {/* Central star burst */}
      <div
        className="animate-success-pop text-5xl"
        style={{ animationDelay: '0.1s' }}
      >
        ⭐
      </div>
    </div>,
    document.body
  )
}

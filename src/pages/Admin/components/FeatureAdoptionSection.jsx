const FEATURES = [
  { key: 'food',     label: 'Comidas',         emoji: '🍽️' },
  { key: 'water',    label: 'Agua',             emoji: '💧' },
  { key: 'exercise', label: 'Ejercicio',        emoji: '🏃' },
  { key: 'habits',   label: 'Hábitos',          emoji: '✅' },
  { key: 'weight',   label: 'Peso',             emoji: '⚖️' },
  { key: 'fasting',  label: 'Ayuno',            emoji: '⏱️' },
  { key: 'bp',       label: 'Presión arterial', emoji: '🩺' },
]

function adoptionColor(rate) {
  if (rate >= 0.6) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Alta adopción' }
  if (rate >= 0.3) return { bar: 'bg-amber-500',   text: 'text-amber-400',   label: 'Adopción media' }
  return                  { bar: 'bg-rose-500',     text: 'text-rose-400',    label: 'Zona fría' }
}

function TrendBadge({ delta }) {
  if (delta === 0) return <span className="text-xs text-gray-600 tabular-nums">—</span>
  const up = delta > 0
  return (
    <span className={`text-xs font-medium tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? '↑' : '↓'}{Math.abs(delta)}
    </span>
  )
}

export default function FeatureAdoptionSection({ adoptionByFeature, trend7ByFeature, totalRecordsByFeature, totalUsers }) {
  const sorted = [...FEATURES].sort((a, b) => (adoptionByFeature[b.key] ?? 0) - (adoptionByFeature[a.key] ?? 0))
  const coldZones = sorted.filter(f => (adoptionByFeature[f.key] ?? 0) / Math.max(totalUsers, 1) < 0.3)

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-300">Adopción por sección</h2>
        <span className="text-xs text-gray-600">{totalUsers} usuarios totales</span>
      </div>
      <p className="text-xs text-gray-600 mb-5">Cuántos usuarios han usado cada sección · tendencia últimos 7 días</p>

      <div className="flex flex-col gap-4">
        {sorted.map(({ key, label, emoji }) => {
          const count = adoptionByFeature[key] ?? 0
          const rate = totalUsers > 0 ? count / totalUsers : 0
          const pct = Math.round(rate * 100)
          const { bar, text, label: statusLabel } = adoptionColor(rate)
          const delta = trend7ByFeature[key] ?? 0
          const records = totalRecordsByFeature[key] ?? 0

          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <span className="text-sm text-gray-300">{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/5 ${text}`}>{statusLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendBadge delta={delta} />
                  <span className="text-xs text-gray-500 tabular-nums">{records.toLocaleString('es-CO')} reg.</span>
                  <span className={`text-sm font-semibold tabular-nums w-20 text-right ${text}`}>
                    {count}/{totalUsers} <span className="text-xs font-normal text-gray-600">({pct}%)</span>
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {coldZones.length > 0 && (
        <div className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-xs font-semibold text-rose-400 mb-1">Zonas frías — menos del 30% de usuarios las usa</p>
          <p className="text-xs text-gray-500">
            {coldZones.map(f => `${f.emoji} ${f.label}`).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}

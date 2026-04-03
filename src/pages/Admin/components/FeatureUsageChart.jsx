const FEATURES = [
  { key: 'food',     label: 'Comidas',         emoji: '🍽️', color: 'bg-orange-500' },
  { key: 'water',    label: 'Agua',             emoji: '💧', color: 'bg-sky-500' },
  { key: 'exercise', label: 'Ejercicio',        emoji: '🏃', color: 'bg-emerald-500' },
  { key: 'habits',   label: 'Hábitos',          emoji: '✅', color: 'bg-violet-500' },
  { key: 'weight',   label: 'Peso',             emoji: '⚖️', color: 'bg-amber-500' },
  { key: 'fasting',  label: 'Ayuno',            emoji: '⏱️', color: 'bg-indigo-500' },
  { key: 'bp',       label: 'Presión arterial', emoji: '🩺', color: 'bg-rose-500' },
]

export default function FeatureUsageChart({ totalRecordsByFeature }) {
  const total = Object.values(totalRecordsByFeature).reduce((a, b) => a + b, 1)
  const max = Math.max(...Object.values(totalRecordsByFeature), 1)
  const sorted = [...FEATURES].sort((a, b) => (totalRecordsByFeature[b.key] ?? 0) - (totalRecordsByFeature[a.key] ?? 0))

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-300">Uso por sección</h2>
        <span className="text-xs text-gray-600">{total.toLocaleString('es-CO')} registros totales</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {sorted.map(({ key, label, emoji, color }) => {
          const count = totalRecordsByFeature[key] ?? 0
          const pct = Math.round((count / max) * 100)
          const sharePct = Math.round((count / total) * 100)
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">{sharePct}%</span>
                  <span className="text-sm font-semibold text-white tabular-nums w-16 text-right">
                    {count.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

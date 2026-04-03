const FEATURES = [
  { key: 'food',     label: 'Comidas',          emoji: '🍽️' },
  { key: 'water',    label: 'Agua',              emoji: '💧' },
  { key: 'exercise', label: 'Ejercicio',         emoji: '🏃' },
  { key: 'habits',   label: 'Hábitos',           emoji: '✅' },
  { key: 'weight',   label: 'Peso',              emoji: '⚖️' },
  { key: 'fasting',  label: 'Ayuno',             emoji: '⏱️' },
  { key: 'bp',       label: 'Presión arterial',  emoji: '🩺' },
]

export default function FeatureUsageChart({ totalRecordsByFeature }) {
  const max = Math.max(...Object.values(totalRecordsByFeature), 1)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Uso por sección</h2>
      <div className="flex flex-col gap-3">
        {FEATURES.map(({ key, label, emoji }) => {
          const count = totalRecordsByFeature[key] ?? 0
          const pct = Math.round((count / max) * 100)
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">{emoji} {label}</span>
                <span className="text-sm font-semibold text-white">{count.toLocaleString('es-CO')}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
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

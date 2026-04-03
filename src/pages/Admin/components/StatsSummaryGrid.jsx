const FEATURE_LABELS = {
  food: 'Comidas',
  exercise: 'Ejercicio',
  water: 'Agua',
  weight: 'Peso',
  habits: 'Hábitos',
  fasting: 'Ayuno',
  bp: 'Presión arterial',
}

export default function StatsSummaryGrid({ data }) {
  const totalLogs = Object.values(data.totalRecordsByFeature).reduce((a, b) => a + b, 0)

  const topFeatureKey = Object.entries(data.totalRecordsByFeature)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  const topUser = data.ranking[0]

  const cards = [
    {
      label: 'Usuarios registrados',
      value: data.totalUsers,
      sub: `${data.totalLogins} inicios de sesión`,
    },
    {
      label: 'Registros totales',
      value: totalLogs.toLocaleString('es-CO'),
      sub: 'en todas las secciones',
    },
    {
      label: 'Sección más usada',
      value: FEATURE_LABELS[topFeatureKey] ?? topFeatureKey,
      sub: `${data.totalRecordsByFeature[topFeatureKey]?.toLocaleString('es-CO')} registros`,
    },
    {
      label: 'Usuario más activo',
      value: topUser?.name ?? '—',
      sub: topUser ? `${topUser.totalLogs} registros` : '',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {cards.map(card => (
        <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className="text-2xl font-bold text-white truncate">{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}

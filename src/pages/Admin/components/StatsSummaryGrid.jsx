const FEATURE_LABELS = {
  food: 'Comidas', exercise: 'Ejercicio', water: 'Agua',
  weight: 'Peso', habits: 'Hábitos', fasting: 'Ayuno', bp: 'Presión',
}

function StatCard({ icon, label, value, sub, accent = 'indigo', trend }) {
  const accents = {
    indigo: { bg: 'from-indigo-500/10 to-indigo-500/5', border: 'border-indigo-500/20', icon: 'text-indigo-400', dot: 'bg-indigo-500' },
    emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', icon: 'text-emerald-400', dot: 'bg-emerald-500' },
    violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20', icon: 'text-violet-400', dot: 'bg-violet-500' },
    amber: { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20', icon: 'text-amber-400', dot: 'bg-amber-500' },
    sky: { bg: 'from-sky-500/10 to-sky-500/5', border: 'border-sky-500/20', icon: 'text-sky-400', dot: 'bg-sky-500' },
    rose: { bg: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-500/20', icon: 'text-rose-400', dot: 'bg-rose-500' },
  }
  const a = accents[accent] || accents.indigo

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.bg} border ${a.border} p-5`}>
      <div className={`text-2xl mb-3 ${a.icon}`}>{icon}</div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
      {trend !== undefined && (
        <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}</span>
        </div>
      )}
    </div>
  )
}

export default function StatsSummaryGrid({ data }) {
  const totalLogs = Object.values(data.totalRecordsByFeature).reduce((a, b) => a + b, 0)
  const topFeatureKey = Object.entries(data.totalRecordsByFeature).sort(([, a], [, b]) => b - a)[0]?.[0]
  const topUser = data.ranking[0]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <StatCard
        icon="👥"
        label="Usuarios"
        value={data.totalUsers}
        sub={`${data.activeUsers7} activos esta semana`}
        accent="indigo"
      />
      <StatCard
        icon="📊"
        label="Registros totales"
        value={totalLogs.toLocaleString('es-CO')}
        sub="en todas las secciones"
        accent="violet"
      />
      <StatCard
        icon="🔑"
        label="Inicios de sesión"
        value={data.totalLogins.toLocaleString('es-CO')}
        sub={`${data.activeUsers30} usuarios activos / 30d`}
        accent="sky"
      />
      <StatCard
        icon="🏆"
        label="Sección líder"
        value={FEATURE_LABELS[topFeatureKey] ?? topFeatureKey ?? '—'}
        sub={`${data.totalRecordsByFeature[topFeatureKey]?.toLocaleString('es-CO')} registros`}
        accent="amber"
      />
      <StatCard
        icon="⭐"
        label="Usuario más activo"
        value={topUser?.name ?? '—'}
        sub={topUser ? `${topUser.totalLogs} registros · ${topUser.loginCount} logins` : ''}
        accent="emerald"
      />
      <StatCard
        icon="💤"
        label="Sin actividad"
        value={data.ranking.filter(u => u.status === 'inactive').length}
        sub="usuarios sin actividad reciente"
        accent="rose"
      />
    </div>
  )
}

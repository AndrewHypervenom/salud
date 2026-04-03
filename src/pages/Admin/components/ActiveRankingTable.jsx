const GOAL_EMOJI = {
  lose_weight: '📉',
  maintain: '⚖️',
  gain_muscle: '💪',
  improve_health: '❤️',
}

const STATUS_CONFIG = {
  active:   { label: 'Activo',   dot: 'bg-emerald-400', text: 'text-emerald-400' },
  recent:   { label: 'Reciente', dot: 'bg-amber-400',   text: 'text-amber-400' },
  inactive: { label: 'Inactivo', dot: 'bg-gray-600',    text: 'text-gray-500' },
}

function formatRelative(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays}d`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)}mes`
  return `hace ${Math.floor(diffDays / 365)}año`
}

const FEATURE_ICONS = { food:'🍽️', exercise:'🏃', water:'💧', weight:'⚖️', habits:'✅', fasting:'⏱️', bp:'🩺' }

export default function ActiveRankingTable({ ranking, onSelectUser }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-gray-300">Usuarios</h2>
        <span className="text-xs text-gray-600">{ranking.length} registrados</span>
      </div>

      <div className="divide-y divide-white/5">
        {ranking.map((user, idx) => {
          const sc = STATUS_CONFIG[user.status] || STATUS_CONFIG.inactive
          const topFeature = Object.entries(user.byFeature || {}).sort(([,a],[,b]) => b - a)[0]

          return (
            <button
              key={user.profileId}
              onClick={() => onSelectUser(user)}
              className="w-full text-left px-5 py-4 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-center gap-4">
                {/* Rank + avatar */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-700 w-4 tabular-nums">{idx + 1}</span>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-sm">
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0f] ${sc.dot}`} />
                  </div>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white text-sm truncate">{user.name}</span>
                    <span className="text-base">{GOAL_EMOJI[user.healthGoal]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{sc.label}</span>
                    {topFeature && topFeature[1] > 0 && (
                      <span className="flex items-center gap-1">
                        <span>{FEATURE_ICONS[topFeature[0]]}</span>
                        <span>{topFeature[0]}: {topFeature[1]}</span>
                      </span>
                    )}
                    {user.badgeCount > 0 && <span>🏅 {user.badgeCount}</span>}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 flex-shrink-0 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-600">Logins</p>
                    <p className="text-sm font-semibold text-gray-300 tabular-nums">{user.loginCount || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Registros</p>
                    <p className="text-sm font-bold text-indigo-400 tabular-nums">{user.totalLogs}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-600">Último acceso</p>
                    <p className="text-sm text-gray-400">{formatRelative(user.lastLogin || user.lastActivity)}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

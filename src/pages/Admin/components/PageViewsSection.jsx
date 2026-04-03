const ALL_PAGES = [
  { page: '/dashboard',         label: 'Dashboard',          emoji: '🏠' },
  { page: '/food',              label: 'Comidas',             emoji: '🍽️' },
  { page: '/food-search',       label: 'Búsqueda de comida', emoji: '🔍' },
  { page: '/water',             label: 'Agua',                emoji: '💧' },
  { page: '/exercise',          label: 'Ejercicio',           emoji: '🏃' },
  { page: '/weight',            label: 'Peso',                emoji: '⚖️' },
  { page: '/habits',            label: 'Hábitos',             emoji: '✅' },
  { page: '/fasting',           label: 'Ayuno',               emoji: '⏱️' },
  { page: '/blood-pressure',    label: 'Presión arterial',    emoji: '🩺' },
  { page: '/progress',          label: 'Progreso',            emoji: '📈' },
  { page: '/calories',          label: 'Calorías',            emoji: '🔥' },
  { page: '/diet',              label: 'Dieta',               emoji: '🥗' },
  { page: '/recipes',           label: 'Recetas',             emoji: '📖' },
  { page: '/doctor-questions',  label: 'Preguntas médicas',   emoji: '🩻' },
  { page: '/badges',            label: 'Insignias',           emoji: '🏅' },
  { page: '/fitness-profile',   label: 'Perfil fitness',      emoji: '💪' },
  { page: '/profiles',          label: 'Perfiles',            emoji: '👤' },
]

export default function PageViewsSection({ pageViewsLast30, pageViewsUniqueCount }) {
  const hasData = Object.keys(pageViewsLast30).length > 0

  const sorted = [...ALL_PAGES]
    .map(p => ({
      ...p,
      views: pageViewsLast30[p.page] ?? 0,
      unique: pageViewsUniqueCount[p.page] ?? 0,
    }))
    .sort((a, b) => b.views - a.views)

  const maxViews = Math.max(...sorted.map(p => p.views), 1)
  const ghostPages = sorted.filter(p => p.views === 0)
  const lowPages = sorted.filter(p => p.views > 0 && p.views < 5)

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-300">Visitas por página</h2>
        <span className="text-xs text-gray-600">últimos 30 días</span>
      </div>
      <p className="text-xs text-gray-600 mb-5">Visitas totales · usuarios únicos por sección</p>

      {!hasData ? (
        <div className="py-8 text-center">
          <p className="text-2xl mb-2">📡</p>
          <p className="text-sm text-gray-500">Sin datos aún</p>
          <p className="text-xs text-gray-600 mt-1">
            Crea la tabla <code className="text-indigo-400">page_views</code> en Supabase y el tracking comenzará automáticamente.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3.5">
            {sorted.map(({ page, label, emoji, views, unique }) => {
              const pct = Math.round((views / maxViews) * 100)
              const isGhost = views === 0
              const isLow = views > 0 && views < 5

              return (
                <div key={page}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{emoji}</span>
                      <span className={`text-sm ${isGhost ? 'text-gray-600' : 'text-gray-300'}`}>{label}</span>
                      {isGhost && <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500">Sin visitas</span>}
                      {isLow && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Poco uso</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{unique} {unique === 1 ? 'usuario' : 'usuarios'}</span>
                      <span className={`text-sm font-semibold tabular-nums w-14 text-right ${isGhost ? 'text-gray-600' : 'text-white'}`}>
                        {views.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isGhost ? 'bg-white/5' : isLow ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {ghostPages.length > 0 && (
            <div className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs font-semibold text-rose-400 mb-1">Páginas fantasma — 0 visitas en 30 días</p>
              <p className="text-xs text-gray-500">{ghostPages.map(p => `${p.emoji} ${p.label}`).join(' · ')}</p>
            </div>
          )}

          {lowPages.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 mb-1">Poco tráfico — menos de 5 visitas</p>
              <p className="text-xs text-gray-500">{lowPages.map(p => `${p.emoji} ${p.label}`).join(' · ')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

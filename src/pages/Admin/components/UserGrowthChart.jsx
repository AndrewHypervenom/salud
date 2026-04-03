const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatMonth(ym) {
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

export default function UserGrowthChart({ userGrowthByMonth }) {
  if (!userGrowthByMonth.length) return null

  const max = Math.max(...userGrowthByMonth.map(d => d.count), 1)
  const BAR_HEIGHT = 80

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Nuevos usuarios por mes
      </h2>
      <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: BAR_HEIGHT + 32 }}>
        {userGrowthByMonth.map(({ month, count }) => {
          const barH = Math.max(Math.round((count / max) * BAR_HEIGHT), 4)
          return (
            <div key={month} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 40 }}>
              <span className="text-xs text-gray-400 font-semibold">{count}</span>
              <div
                className="w-8 bg-indigo-500 rounded-t"
                style={{ height: barH }}
              />
              <span className="text-xs text-gray-500 text-center leading-tight">{formatMonth(month)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

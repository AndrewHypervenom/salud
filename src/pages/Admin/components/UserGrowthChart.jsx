const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatMonth(ym) {
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} '${year.slice(2)}`
}

export default function UserGrowthChart({ userGrowthByMonth, totalUsers }) {
  if (!userGrowthByMonth.length) return null

  const max = Math.max(...userGrowthByMonth.map(d => d.count), 1)
  const BAR_MAX_H = 72

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-300">Crecimiento de usuarios</h2>
        <span className="text-xs text-gray-600">{totalUsers} total</span>
      </div>

      <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ minHeight: BAR_MAX_H + 40 }}>
        {userGrowthByMonth.map(({ month, count }, idx) => {
          const barH = Math.max(Math.round((count / max) * BAR_MAX_H), 4)
          const isLast = idx === userGrowthByMonth.length - 1
          return (
            <div key={month} className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ minWidth: 36 }}>
              <span className={`text-xs font-bold tabular-nums ${isLast ? 'text-indigo-400' : 'text-gray-500'}`}>
                {count}
              </span>
              <div className="relative" style={{ height: BAR_MAX_H }}>
                <div
                  className={`absolute bottom-0 w-6 rounded-t-md transition-all duration-700 ${
                    isLast ? 'bg-indigo-500' : 'bg-indigo-500/30'
                  }`}
                  style={{ height: barH }}
                />
              </div>
              <span className="text-[10px] text-gray-600 text-center whitespace-nowrap">{formatMonth(month)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

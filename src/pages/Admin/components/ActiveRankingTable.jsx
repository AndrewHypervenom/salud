function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ActiveRankingTable({ ranking, onSelectUser }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Ranking de usuarios
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2 pr-3">#</th>
              <th className="text-left pb-2 pr-3">Nombre</th>
              <th className="text-right pb-2 pr-3">Registros</th>
              <th className="text-right pb-2 pr-3">Logins</th>
              <th className="text-right pb-2 pr-3">Último login</th>
              <th className="text-right pb-2">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((user, idx) => (
              <tr
                key={user.profileId}
                onClick={() => onSelectUser(user)}
                className="border-b border-gray-800 last:border-0 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="py-3 pr-3 text-gray-500">{idx + 1}</td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center text-indigo-300 font-bold text-xs flex-shrink-0">
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-white font-medium truncate max-w-[100px]">{user.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-right font-semibold text-indigo-400">{user.totalLogs}</td>
                <td className="py-3 pr-3 text-right text-gray-400">{user.loginCount || '—'}</td>
                <td className="py-3 pr-3 text-right text-gray-400 text-xs">{formatDate(user.lastLogin)}</td>
                <td className="py-3 text-right text-gray-400 text-xs">{formatDate(user.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

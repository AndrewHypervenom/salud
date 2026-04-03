import { useNavigate } from 'react-router-dom'

export default function AdminHeader() {
  const navigate = useNavigate()
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-widest">En vivo</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Panel de control</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{dateStr} · {timeStr}</p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Salir
      </button>
    </div>
  )
}

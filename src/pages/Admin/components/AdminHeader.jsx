import { useNavigate } from 'react-router-dom'

export default function AdminHeader({ lastRefreshed }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Panel de control</h1>
        {lastRefreshed && (
          <p className="text-xs text-gray-500 mt-0.5">
            Actualizado {new Date(lastRefreshed).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
      >
        Salir
      </button>
    </div>
  )
}

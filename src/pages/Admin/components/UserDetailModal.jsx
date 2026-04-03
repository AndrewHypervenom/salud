import { useEffect, useState } from 'react'
import { fetchUserDetail } from '../../../hooks/useAdminStats'

const GOAL_LABELS = {
  lose_weight: 'Bajar peso',
  maintain: 'Mantener peso',
  gain_muscle: 'Ganar músculo',
  improve_health: 'Mejorar salud',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function maskPhone(phone) {
  if (!phone) return '—'
  return phone.slice(0, 3) + '****' + phone.slice(-3)
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}

export default function UserDetailModal({ user, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDetail(user.profileId).then(d => {
      setDetail(d)
      setLoading(false)
    })
  }, [user.profileId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center text-indigo-300 font-bold text-lg">
              {user.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white">{user.name}</p>
              <p className="text-xs text-gray-500">{maskPhone(user.phone)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {/* Profile info */}
          <Section title="Perfil">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Objetivo</p>
                <p className="text-white font-medium">{GOAL_LABELS[user.healthGoal] ?? user.healthGoal}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Registrado</p>
                <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Total registros</p>
                <p className="text-indigo-400 font-bold text-lg">{user.totalLogs}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Logins</p>
                <p className="text-indigo-400 font-bold text-lg">{user.loginCount || 0}</p>
              </div>
            </div>
          </Section>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
            </div>
          ) : detail ? (
            <>
              {/* Food logs */}
              {detail.food.length > 0 && (
                <Section title={`Comidas (${detail.food.length})`}>
                  <div className="flex flex-col gap-1.5">
                    {detail.food.slice(0, 8).map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-gray-300 truncate max-w-[60%]">{f.description || f.meal_type}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {f.calories_estimated && <span className="text-yellow-400 text-xs">{f.calories_estimated} kcal</span>}
                          <span className="text-gray-600 text-xs">{formatDate(f.logged_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Exercise logs */}
              {detail.exercise.length > 0 && (
                <Section title={`Ejercicio (${detail.exercise.length})`}>
                  <div className="flex flex-col gap-1.5">
                    {detail.exercise.slice(0, 6).map((e, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-gray-300 truncate max-w-[60%]">{e.name || e.exercise_type}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {e.duration_minutes && <span className="text-green-400 text-xs">{e.duration_minutes} min</span>}
                          <span className="text-gray-600 text-xs">{formatDate(e.logged_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Weight */}
              {detail.weight.length > 0 && (
                <Section title={`Peso (${detail.weight.length} registros)`}>
                  <div className="flex gap-2 flex-wrap">
                    {detail.weight.slice(0, 6).map((w, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 text-sm">
                        <span className="text-white font-medium">{w.weight_kg} kg</span>
                        <span className="text-gray-500 ml-2 text-xs">{formatDate(w.logged_date)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Badges */}
              {detail.badges.length > 0 && (
                <Section title={`Logros (${detail.badges.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.badges.map((b, i) => (
                      <span key={i} className="bg-indigo-900 text-indigo-300 text-xs px-2 py-1 rounded-full">
                        {b.badge_key}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Resumen conteos */}
              <Section title="Resumen de actividad">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    { label: 'Agua', count: detail.water.length },
                    { label: 'Hábitos', count: detail.habits.length },
                    { label: 'Ayuno', count: detail.fasting.length },
                    { label: 'Presión', count: detail.bp.length },
                  ].map(({ label, count }) => (
                    <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-white font-bold">{count}</p>
                      <p className="text-gray-500 text-xs">{label}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

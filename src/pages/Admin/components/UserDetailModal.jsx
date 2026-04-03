import { useEffect, useState } from 'react'
import { fetchUserDetail } from '../../../hooks/useAdminStats'

const GOAL_LABELS = {
  lose_weight: 'Bajar de peso',
  maintain: 'Mantener peso',
  gain_muscle: 'Ganar músculo',
  improve_health: 'Mejorar salud',
}

const ACTIVITY_LABELS = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
}

const MEAL_LABELS = {
  breakfast: 'Desayuno', lunch: 'Almuerzo',
  dinner: 'Cena', snack: 'Snack',
}

const EXERCISE_LABELS = {
  cardio: 'Cardio', strength: 'Fuerza',
  flexibility: 'Flexibilidad', sports: 'Deporte', other: 'Otro',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatRelative(dateStr) {
  if (!dateStr) return '—'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  return `hace ${Math.floor(diffDays / 30)} meses`
}

function maskPhone(phone) {
  if (!phone) return '—'
  if (phone.length <= 6) return phone
  return phone.slice(0, 3) + ' ****' + phone.slice(-3)
}

function calcIMC(weight, height) {
  if (!weight || !height) return null
  const h = height / 100
  return (weight / (h * h)).toFixed(1)
}

function IMCLabel(imc) {
  if (!imc) return null
  const v = parseFloat(imc)
  if (v < 18.5) return { label: 'Bajo peso', color: 'text-sky-400' }
  if (v < 25) return { label: 'Normal', color: 'text-emerald-400' }
  if (v < 30) return { label: 'Sobrepeso', color: 'text-amber-400' }
  return { label: 'Obesidad', color: 'text-rose-400' }
}

function Section({ title, icon, children, count }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        {count !== undefined && (
          <span className="ml-auto text-xs text-gray-600">{count} registros</span>
        )}
      </div>
      {children}
    </div>
  )
}

function InfoChip({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.05] rounded-xl px-3 py-2.5 min-w-0">
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold truncate ${color}`}>{value ?? '—'}</p>
    </div>
  )
}

export default function UserDetailModal({ user, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    setLoading(true)
    fetchUserDetail(user.profileId).then(d => {
      setDetail(d)
      setLoading(false)
    })
  }, [user.profileId])

  const imc = calcIMC(user.weightKg, user.heightCm)
  const imcInfo = IMCLabel(imc)

  const TABS = [
    { key: 'overview', label: 'Resumen' },
    { key: 'activity', label: 'Actividad' },
    { key: 'health',   label: 'Salud' },
    { key: 'logins',   label: 'Accesos' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111118] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-lg">
              {user.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-base">{user.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  user.status === 'recent' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {user.status === 'active' ? 'Activo' : user.status === 'recent' ? 'Reciente' : 'Inactivo'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{maskPhone(user.phone)} · desde {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all text-xl">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1 flex-shrink-0 border-b border-white/5 pb-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'text-indigo-400 border-b-2 border-indigo-500 -mb-px'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-7 h-7 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : detail && (
            <>
              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <div>
                  <Section title="Datos personales" icon="👤">
                    <div className="grid grid-cols-3 gap-2">
                      <InfoChip label="Edad" value={user.age ? `${user.age} años` : null} />
                      <InfoChip label="Sexo" value={user.sex === 'male' ? 'Hombre' : user.sex === 'female' ? 'Mujer' : null} />
                      <InfoChip label="Actividad" value={ACTIVITY_LABELS[user.activity]} />
                      <InfoChip label="Peso" value={user.weightKg ? `${user.weightKg} kg` : null} />
                      <InfoChip label="Talla" value={user.heightCm ? `${user.heightCm} cm` : null} />
                      <InfoChip label="IMC" value={imc ? `${imc} — ${imcInfo?.label}` : null} color={imcInfo?.color} />
                    </div>
                  </Section>

                  <Section title="Objetivo" icon="🎯">
                    <div className="bg-white/[0.04] rounded-xl px-4 py-3">
                      <p className="text-white font-medium">{GOAL_LABELS[user.healthGoal] ?? user.healthGoal}</p>
                    </div>
                  </Section>

                  <Section title="Resumen de uso" icon="📊">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-indigo-400 tabular-nums">{user.totalLogs}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Registros totales</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400 tabular-nums">{user.loginCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Inicios de sesión</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-amber-400 tabular-nums">{user.badgeCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Logros</p>
                      </div>
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-violet-400 tabular-nums">{user.analysisCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Análisis IA</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <InfoChip label="Último acceso" value={formatRelative(user.lastLogin || user.lastActivity)} color="text-gray-300" />
                      <InfoChip label="Calorías registradas" value={user.totalCalories > 0 ? `${user.totalCalories.toLocaleString('es-CO')} kcal` : null} color="text-orange-400" />
                      <InfoChip label="Ejercicio total" value={user.totalExerciseMin > 0 ? `${user.totalExerciseMin} min` : null} color="text-emerald-400" />
                    </div>
                  </Section>

                  <Section title="Uso por sección" icon="🗂️">
                    {Object.entries(user.byFeature || {})
                      .sort(([,a],[,b]) => b - a)
                      .filter(([,v]) => v > 0)
                      .map(([key, count]) => {
                        const icons = { food:'🍽️', exercise:'🏃', water:'💧', weight:'⚖️', habits:'✅', fasting:'⏱️', bp:'🩺' }
                        const labels = { food:'Comidas', exercise:'Ejercicio', water:'Agua', weight:'Peso', habits:'Hábitos', fasting:'Ayuno', bp:'Presión' }
                        const max = Math.max(...Object.values(user.byFeature || {}), 1)
                        return (
                          <div key={key} className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">{icons[key]} {labels[key]}</span>
                              <span className="text-white font-semibold">{count}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                          </div>
                        )
                      })}
                  </Section>

                  {/* Badges */}
                  {detail.badges.length > 0 && (
                    <Section title="Logros" icon="🏅" count={detail.badges.length}>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.badges.map((b, i) => (
                          <span key={i} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full">
                            {b.badge_key}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Latest AI analysis */}
                  {detail.analyses.length > 0 && (
                    <Section title="Análisis IA recientes" icon="🤖" count={detail.analyses.length}>
                      <div className="flex flex-col gap-2">
                        {detail.analyses.slice(0, 3).map((a, i) => (
                          <div key={i} className="bg-white/[0.04] rounded-xl px-4 py-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{formatDate(a.analysis_date)}</span>
                              {a.total_calories && (
                                <span className="text-xs text-orange-400">{a.total_calories} / {a.cal_target} kcal</span>
                              )}
                            </div>
                            {a.motivation && (
                              <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{a.motivation}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}

              {/* ACTIVITY TAB */}
              {tab === 'activity' && (
                <div>
                  {detail.food.length > 0 && (
                    <Section title="Comidas recientes" icon="🍽️" count={detail.food.length}>
                      <div className="flex flex-col gap-1.5">
                        {detail.food.slice(0, 10).map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate">{f.description || MEAL_LABELS[f.meal_type] || f.meal_type}</p>
                              <p className="text-xs text-gray-600">{formatDateTime(f.logged_at)}</p>
                            </div>
                            <div className="flex flex-col items-end ml-3 flex-shrink-0">
                              {f.calories_estimated && <span className="text-xs text-orange-400 font-medium">{f.calories_estimated} kcal</span>}
                              {f.protein_g && <span className="text-xs text-gray-600">{f.protein_g}g prot</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {detail.exercise.length > 0 && (
                    <Section title="Ejercicios recientes" icon="🏃" count={detail.exercise.length}>
                      <div className="flex flex-col gap-1.5">
                        {detail.exercise.slice(0, 8).map((e, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate">{e.name || EXERCISE_LABELS[e.exercise_type] || e.exercise_type}</p>
                              <p className="text-xs text-gray-600">{formatDate(e.logged_at)}</p>
                            </div>
                            <div className="flex flex-col items-end ml-3 flex-shrink-0">
                              {e.duration_minutes && <span className="text-xs text-emerald-400 font-medium">{e.duration_minutes} min</span>}
                              {e.calories_burned && <span className="text-xs text-gray-600">{e.calories_burned} kcal</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {detail.habits.length > 0 && (
                    <Section title="Hábitos completados" icon="✅" count={detail.habits.length}>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.habits.slice(0, 15).map((h, i) => (
                          <span key={i} className="bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full">
                            {formatDate(h.completed_date)}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {detail.fasting.length > 0 && (
                    <Section title="Sesiones de ayuno" icon="⏱️" count={detail.fasting.length}>
                      <div className="flex flex-col gap-1.5">
                        {detail.fasting.slice(0, 6).map((f, i) => {
                          const duration = f.end_time
                            ? ((new Date(f.end_time) - new Date(f.start_time)) / 3600000).toFixed(1)
                            : null
                          return (
                            <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                              <div>
                                <p className="text-sm text-gray-200">{formatDate(f.start_time)}</p>
                                <p className="text-xs text-gray-600">Objetivo: {f.target_hours}h</p>
                              </div>
                              <div className="text-right">
                                {duration && <p className="text-sm font-medium text-indigo-400">{duration}h</p>}
                                <p className={`text-xs ${f.completed ? 'text-emerald-400' : 'text-gray-500'}`}>
                                  {f.completed ? '✓ Completado' : 'Interrumpido'}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Section>
                  )}
                </div>
              )}

              {/* HEALTH TAB */}
              {tab === 'health' && (
                <div>
                  {detail.weight.length > 0 && (
                    <Section title="Historial de peso" icon="⚖️" count={detail.weight.length}>
                      <div className="flex flex-col gap-1.5">
                        {detail.weight.slice(0, 8).map((w, i) => {
                          const prev = detail.weight[i + 1]
                          const diff = prev ? (w.weight_kg - prev.weight_kg).toFixed(1) : null
                          return (
                            <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                              <span className="text-xs text-gray-500">{formatDate(w.logged_date)}</span>
                              <div className="flex items-center gap-2">
                                {diff && (
                                  <span className={`text-xs ${parseFloat(diff) < 0 ? 'text-emerald-400' : parseFloat(diff) > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                    {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                                  </span>
                                )}
                                <span className="text-sm font-semibold text-white">{w.weight_kg} kg</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Section>
                  )}

                  {detail.water.length > 0 && (
                    <Section title="Registro de agua" icon="💧" count={detail.water.length}>
                      <div className="flex flex-col gap-1.5">
                        {detail.water.slice(0, 8).map((w, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                            <span className="text-xs text-gray-500">{formatDateTime(w.logged_at)}</span>
                            <span className="text-sm font-semibold text-sky-400">{w.amount_ml} ml</span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {detail.bp.length > 0 && (
                    <Section title="Presión arterial" icon="🩺" count={detail.bp.length}>
                      <div className="flex flex-col gap-1.5">
                        {detail.bp.slice(0, 8).map((b, i) => {
                          const status = b.systolic >= 140 || b.diastolic >= 90 ? 'Alta'
                            : b.systolic <= 90 || b.diastolic <= 60 ? 'Baja' : 'Normal'
                          const statusColor = status === 'Normal' ? 'text-emerald-400' : 'text-rose-400'
                          return (
                            <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                              <div>
                                <p className="text-sm font-semibold text-white">{b.systolic}/{b.diastolic} mmHg</p>
                                <p className="text-xs text-gray-500">{b.pulse ? `Pulso: ${b.pulse} bpm · ` : ''}{formatDate(b.measured_at)}</p>
                              </div>
                              <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
                            </div>
                          )
                        })}
                      </div>
                    </Section>
                  )}

                  {detail.water.length === 0 && detail.bp.length === 0 && detail.weight.length === 0 && (
                    <div className="text-center py-12 text-gray-600">
                      <p className="text-4xl mb-3">🏥</p>
                      <p className="text-sm">Sin registros de salud</p>
                    </div>
                  )}
                </div>
              )}

              {/* LOGINS TAB */}
              {tab === 'logins' && (
                <div>
                  <Section title="Historial de accesos" icon="🔑" count={detail.loginLogs.length}>
                    {detail.loginLogs.length === 0 ? (
                      <div className="text-center py-10 text-gray-600">
                        <p className="text-3xl mb-2">🔒</p>
                        <p className="text-sm">Sin registros de acceso aún</p>
                        <p className="text-xs mt-1">Se registran desde la próxima vez que inicie sesión</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {detail.loginLogs.map((l, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                            <div>
                              <p className="text-sm text-gray-200">{formatDateTime(l.logged_at)}</p>
                              <p className="text-xs text-gray-600">{formatRelative(l.logged_at)}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              l.source === 'pin'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {l.source === 'pin' ? '🔢 PIN' : '📱 Directo'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="Estadísticas de acceso" icon="📈">
                    <div className="grid grid-cols-2 gap-2">
                      <InfoChip label="Total logins" value={user.loginCount} color="text-indigo-400" />
                      <InfoChip label="Primer acceso" value={user.firstLogin ? formatDate(user.firstLogin) : 'Sin registro'} color="text-gray-300" />
                      <InfoChip label="Último acceso" value={user.lastLogin ? formatRelative(user.lastLogin) : 'Sin registro'} color="text-gray-300" />
                      <InfoChip label="Días desde registro" value={user.createdAt ? `${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000*60*60*24))}d` : null} color="text-gray-300" />
                    </div>
                  </Section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

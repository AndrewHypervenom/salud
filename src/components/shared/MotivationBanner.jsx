import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const MSGS_GENERAL = [
  '💪 Cada paso cuenta. Sal a caminar hoy y siente la diferencia.',
  '🌟 30 minutos de ejercicio pueden transformar tu día entero.',
  '🔥 El mejor momento para ejercitarte es ahora. ¡Tú puedes!',
  '⚡ Una caminata rápida te da más energía que un café.',
  '🎯 Pequeño esfuerzo hoy = gran resultado mañana.',
  '🌈 El ejercicio es el antidepresivo más poderoso. ¡Vamos!',
  '🏃 Tu cuerpo fue diseñado para moverse. ¡Dale lo que necesita!',
  '🌤️ Un poco de movimiento cambia tu humor en minutos. ¡Inténtalo!',
  '✨ Cada vez que te ejercitas le regalas años a tu vida.',
  '🦵 Siente la fuerza de tu cuerpo. ¡Muévete hoy!',
]

const MSGS_GYM = [
  '🏋️ El gimnasio te está esperando. Cada rep te hace más fuerte.',
  '💥 Hoy es un buen día para superar tu marca en el gym.',
  '🔩 La constancia en el gym construye el cuerpo que quieres.',
]

const MSGS_WALKING = [
  '🚶 20 minutos de caminata al día pueden cambiar tu salud.',
  '🌿 Sal a caminar y despeja tu mente. Tu cuerpo te lo agradece.',
  '👟 Una caminata al aire libre hace maravillas. ¡Vamos a dar unos pasos!',
]

const MSGS_SPORTS = [
  '⚽ ¿Listo/a para jugar? El deporte es diversión y salud.',
  '🏊 El movimiento en cualquier forma es siempre una ganancia.',
  '🎾 Encuentra el deporte que amas y nunca sentirás que trabajas.',
]

const MSGS_YOGA = [
  '🧘 Unos minutos de yoga o stretching mejoran todo tu día.',
  '🌸 La flexibilidad y la calma también son forma de ejercicio.',
]

const MSGS_BY_DAY = {
  0: '☀️ El domingo es perfecto para recargar con movimiento.',
  1: '🚀 ¡Empieza la semana con energía! Haz ejercicio hoy.',
  5: '🎉 ¡Cierra la semana activo/a! Tú lo mereces.',
  6: '🏞️ ¡Sábado activo! El fin de semana es para moverse.',
}

const ACTIVITY_POOLS = {
  gym:          MSGS_GYM,
  running:      MSGS_SPORTS,
  cycling:      MSGS_SPORTS,
  sports:       MSGS_SPORTS,
  walking:      MSGS_WALKING,
  yoga:         MSGS_YOGA,
  swimming:     MSGS_SPORTS,
  home_workout: MSGS_GENERAL,
}

function buildPool(fitnessProfile) {
  const activities = fitnessProfile?.preferred_activities ?? []
  let pool = []
  for (const act of activities) {
    const specific = ACTIVITY_POOLS[act]
    if (specific) pool.push(...specific)
  }
  if (pool.length < 4) pool = [...pool, ...MSGS_GENERAL]
  return pool
}

function pickMessage(profileId, fitnessProfile) {
  const today = new Date()
  const day = today.getDay()
  if (MSGS_BY_DAY[day]) return MSGS_BY_DAY[day]
  const pool = buildPool(fitnessProfile)
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
  const seed = dayOfYear + (profileId?.charCodeAt(0) ?? 0)
  return pool[seed % pool.length]
}

const AUTO_DISMISS_MS = 5000

export function MotivationBanner({ profileId, fitnessProfile }) {
  const { justLoggedInProfileId, acknowledgeLogin } = useAuth()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!profileId || justLoggedInProfileId !== profileId) return
    setMessage(pickMessage(profileId, fitnessProfile))
    setVisible(true)
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [profileId, justLoggedInProfileId])

  const dismiss = () => {
    acknowledgeLogin(profileId)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-5 py-3 animate-slide-down border border-emerald-200 dark:border-emerald-700 max-w-[90vw]">
      <span className="text-xl flex-shrink-0">🏃</span>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{message}</p>
      <button onClick={dismiss} className="ml-2 text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0">×</button>
    </div>
  )
}

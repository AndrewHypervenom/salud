import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

// ── Pools de mensajes ──────────────────────────────────────────────────────

const MSGS_GENERAL = [
  '💪 Cada paso cuenta. Sal a caminar hoy y siente la diferencia.',
  '🌟 30 minutos de ejercicio pueden transformar tu día entero.',
  '🔥 El mejor momento para ejercitarte es ahora. ¡Tú puedes!',
  '⚡ Una caminata rápida te da más energía que un café.',
  '🎯 Pequeño esfuerzo hoy = gran resultado mañana.',
  '🌈 El ejercicio es el antidepresivo más poderoso. ¡Vamos!',
  '🏃 Tu cuerpo fue diseñado para moverse. ¡Dale lo que necesita!',
  '🌤️ Un poco de movimiento cambia tu humor en minutos.',
  '✨ Cada vez que te ejercitas le regalas años a tu vida.',
  '🦵 Siente la fuerza de tu cuerpo. ¡Muévete hoy!',
  '🎶 Pon tu canción favorita y muévete 20 minutos. ¡Eso es todo!',
  '🌿 El movimiento es medicina. Tu dosis de hoy te espera.',
  '🏅 Los hábitos pequeños construyen resultados grandes.',
  '🔑 La clave del cambio es empezar, no la perfección.',
  '💡 Tu futuro yo te agradecerá el esfuerzo de hoy.',
]

const MSGS_GYM = [
  '🏋️ El gimnasio te está esperando. Cada rep te hace más fuerte.',
  '💥 Hoy es un buen día para superar tu marca.',
  '🔩 La constancia construye el cuerpo que quieres.',
  '🪨 Pesos más pesados, mente más fuerte. ¡Al gym!',
  '📈 Progreso, no perfección. Cada sesión suma.',
]

const MSGS_WALKING = [
  '🚶 20 minutos de caminata al día pueden cambiar tu salud.',
  '🌿 Sal a caminar y despeja tu mente. Tu cuerpo te lo agradece.',
  '👟 Una caminata al aire libre hace maravillas.',
  '🗺️ Explora un camino nuevo hoy. El movimiento es libertad.',
  '☁️ Cualquier clima es bueno para dar unos pasos. ¡Vamos!',
]

const MSGS_SPORTS = [
  '⚽ ¿Listo para jugar? El deporte es diversión y salud.',
  '🏊 El movimiento en cualquier forma es siempre una ganancia.',
  '🎾 Encuentra el deporte que amas y nunca sentirás que trabajas.',
  '🚴 Pedalea hacia una versión mejor de ti.',
  '🏃 Corre tu propia carrera. A tu ritmo, a tu manera.',
]

const MSGS_YOGA = [
  '🧘 Unos minutos de yoga o stretching mejoran todo tu día.',
  '🌸 La flexibilidad y la calma también son forma de ejercicio.',
  '🕊️ Respira, estírate, recarga. Tu cuerpo necesita ese momento.',
  '🌊 El equilibrio interior se construye con movimiento consciente.',
]

const MSGS_LOSE_WEIGHT = [
  '🔥 Cada movimiento quema calorías. Cada caloría importa.',
  '📉 Constancia + movimiento = la fórmula que funciona.',
  '💧 Muévete, hidrátate y descansa. Tres pilares de tu meta.',
  '🥗 Ejercicio + buena alimentación: la combinación ganadora.',
  '⏱️ 20 minutos de ejercicio hoy es un paso real hacia tu meta.',
]

const MSGS_GAIN_MUSCLE = [
  '💪 Los músculos se construyen sesión a sesión. No faltes hoy.',
  '🥩 Entrena fuerte, come bien, descansa. El ciclo del progreso.',
  '📊 Cada semana que entrenas eres más fuerte que la anterior.',
  '🔱 La fuerza no se improvisa. Se construye con disciplina.',
  '🏗️ Tu cuerpo es tu proyecto. Dale la atención que merece.',
]

const MSGS_IMPROVE_HEALTH = [
  '❤️ Mover el cuerpo es cuidar el corazón. Literalmente.',
  '🧠 El ejercicio mejora la memoria, el humor y el sueño.',
  '🌱 Cada semana activa es una inversión en tu salud futura.',
  '🩺 El mejor seguro de salud es el movimiento diario.',
  '🌞 Un cuerpo activo es un cuerpo que envejece mejor.',
]

const MSGS_MAINTAIN = [
  '⚖️ Mantener el ritmo es también un logro. ¡Sigue así!',
  '🔄 La consistencia es lo que separa el éxito del intento.',
  '🏆 Ya llegaste lejos. Hoy es un día más para sostener lo ganado.',
  '🛡️ Tu hábito de ejercicio es tu mejor escudo. No lo rompas.',
  '✅ Otro día, otro entrenamiento. Así se mantienen los resultados.',
]

const MSGS_BEGINNER = [
  '🌱 Cada experto fue principiante. Hoy das otro paso adelante.',
  '🎯 No necesitas hacer mucho. Solo hacer algo. ¡Empieza!',
  '👣 El primer paso es siempre el más importante. Dalo hoy.',
  '🐢 Despacio pero constante. Eso es lo que construye hábitos.',
]

const MSGS_ADVANCED = [
  '🚀 Llevas tiempo en esto. Hoy empuja un poco más fuerte.',
  '🔬 Los detalles marcan la diferencia en este nivel. ¡Enfócate!',
  '🏅 Tu disciplina es inspiración. Mantén el estándar.',
  '⚡ Cuerpo entrenado, mente entrenada. Domina ambos hoy.',
]

const MSGS_ROUTINE_DAY = [
  '📅 Hoy es tu día de entrenamiento. ¡No lo dejes pasar!',
  '🗓️ Está en tu rutina por algo. Tu cuerpo ya lo espera.',
  '✊ Tu plan dice que hoy toca moverse. Respeta el proceso.',
]

const MSGS_REST_DAY = [
  '🛌 Hoy es día de descanso activo. Un paseo suave también suma.',
  '♻️ El descanso es parte del entrenamiento. Recupérate bien.',
  '🧊 Descansa, estírate y prepárate para el próximo entrenamiento.',
]

const MSGS_BY_DAY = {
  0: [
    '☀️ El domingo es perfecto para recargar con movimiento.',
    '🌅 Domingo activo: el mejor inicio para la semana que viene.',
    '🧘 Aprovecha el domingo para estirarte y moverte sin prisa.',
  ],
  1: [
    '🚀 ¡Empieza la semana con energía! Haz ejercicio hoy.',
    '💪 Lunes = nuevo comienzo. ¡Arranca con fuerza!',
    '📅 La mejor manera de comenzar la semana: moverse.',
  ],
  5: [
    '🎉 ¡Cierra la semana activo! Tú lo mereces.',
    '🏁 Viernes de entrenamiento: termina fuerte la semana.',
    '🔥 Último empujón de la semana. ¡Dale todo!',
    '🎯 Viernes activo = fin de semana con orgullo.',
  ],
  6: [
    '🏞️ ¡Sábado activo! El fin de semana es para moverse.',
    '🌄 Sábado de aventura: sal, muévete, disfruta.',
    '⚡ Fin de semana activo. Tu cuerpo te lo agradecerá.',
  ],
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

const GOAL_POOLS = {
  lose_weight:     MSGS_LOSE_WEIGHT,
  gain_muscle:     MSGS_GAIN_MUSCLE,
  improve_health:  MSGS_IMPROVE_HEALTH,
  maintain:        MSGS_MAINTAIN,
}

// ── Selector de mensaje ────────────────────────────────────────────────────

function buildPool(profile) {
  const fp = profile?.fitness_profile ?? {}
  const activities = fp.preferred_activities ?? []
  const goals = fp.goals ?? (profile?.health_goal ? [profile.health_goal] : [])
  const level = fp.experience_level

  let pool = []

  // Por actividad preferida
  for (const act of activities) {
    const specific = ACTIVITY_POOLS[act]
    if (specific) pool.push(...specific)
  }

  // Por meta de salud
  for (const g of goals) {
    const gPool = GOAL_POOLS[g]
    if (gPool) pool.push(...gPool)
  }

  // Por nivel de experiencia
  if (level === 'beginner') pool.push(...MSGS_BEGINNER)
  if (level === 'advanced' || level === 'intermediate') pool.push(...MSGS_ADVANCED)

  // Fallback
  if (pool.length < 5) pool.push(...MSGS_GENERAL)

  return pool
}

function getTodayDayName() {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return days[new Date().getDay()]
}

function isRoutineDay(profile) {
  const routineDays = profile?.fitness_profile?.routine_days ?? []
  if (routineDays.length === 0) return null
  return routineDays.includes(getTodayDayName())
}

function getLoginCount(profileId) {
  const key = `motiv_login_count_${profileId}`
  const count = parseInt(localStorage.getItem(key) ?? '0', 10)
  const next = count + 1
  localStorage.setItem(key, String(next))
  return next
}

function pickMessage(profileId, profile) {
  const today = new Date()
  const day = today.getDay()

  // Día especial de la semana
  if (MSGS_BY_DAY[day]) {
    const pool = MSGS_BY_DAY[day]
    const count = getLoginCount(profileId)
    return pool[count % pool.length]
  }

  // Día de rutina o descanso
  const routine = isRoutineDay(profile)
  if (routine === true) {
    const routinePool = MSGS_ROUTINE_DAY
    const count = getLoginCount(profileId)
    return routinePool[count % routinePool.length]
  }
  if (routine === false) {
    const restPool = MSGS_REST_DAY
    const count = getLoginCount(profileId)
    return restPool[count % restPool.length]
  }

  // Pool personalizado según perfil
  const pool = buildPool(profile)
  const count = getLoginCount(profileId)
  return pool[count % pool.length]
}

function withName(message, name) {
  if (!name) return message
  const firstName = name.trim().split(' ')[0]
  return `${message.replace(/\.$/, '')} ¡Vamos, ${firstName}!`
}

// ── Componente ─────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 5000

export function MotivationBanner({ profileId, profile }) {
  const { justLoggedInProfileId, acknowledgeLogin } = useAuth()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!profileId || justLoggedInProfileId !== profileId) return
    const raw = pickMessage(profileId, profile)
    setMessage(withName(raw, profile?.name))
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

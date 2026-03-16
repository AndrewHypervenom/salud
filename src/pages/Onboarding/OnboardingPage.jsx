import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useGroqOnboarding } from '../../hooks/useGroqOnboarding'
import { useHabits } from '../../hooks/useHabits'
import { hashPin } from '../../lib/crypto'
import { Spinner } from '../../components/ui/Spinner'
import PinSetupStep from './PinSetupStep'

// Normalize sex field — AI may return Spanish values
const SEX_MAP = {
  masculino: 'male', male: 'male', m: 'male', hombre: 'male',
  femenino: 'female', female: 'female', f: 'female', mujer: 'female',
}

// Normalize activity field — AI may return Spanish values
const ACTIVITY_MAP = {
  sedentario: 'sedentary', sedentary: 'sedentary',
  ligero: 'light', light: 'light', leve: 'light',
  moderado: 'moderate', moderate: 'moderate',
  activo: 'active', active: 'active',
  'muy activo': 'very_active', very_active: 'very_active', muy_activo: 'very_active',
}

function normalizeExtracted(raw) {
  return {
    name: String(raw.name || '').trim(),
    age: parseInt(raw.age),
    weight_kg: parseFloat(raw.weight_kg),
    height_cm: parseFloat(raw.height_cm),
    sex: SEX_MAP[String(raw.sex || '').toLowerCase().trim()] ?? raw.sex,
    activity: ACTIVITY_MAP[String(raw.activity || '').toLowerCase().trim()] ?? 'sedentary',
    notes: String(raw.notes || '').trim(),
  }
}

function validateProfile(data) {
  if (!data.name || data.name.length < 2) return 'El nombre no es válido (mínimo 2 caracteres).'
  if (isNaN(data.age) || data.age < 1 || data.age > 120) return `Edad inválida: "${data.age}". Debe estar entre 1 y 120.`
  if (isNaN(data.weight_kg) || data.weight_kg < 20 || data.weight_kg > 300) return `Peso inválido: "${data.weight_kg}". Debe estar entre 20 y 300 kg.`
  if (isNaN(data.height_cm) || data.height_cm < 50 || data.height_cm > 250) return `Estatura inválida: "${data.height_cm}". Debe estar entre 50 y 250 cm.`
  if (!['male', 'female'].includes(data.sex)) return `Sexo inválido: "${data.sex}". Vuelve al chat y responde "masculino" o "femenino".`
  if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(data.activity)) return `Nivel de actividad inválido: "${data.activity}".`
  return null
}

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createProfile } = useProfiles()
  const { setActiveProfileId } = useProfileContext()
  const { unlockProfile } = useAuth()
  const { messages, loading, error, done, extracted, sendMessage } = useGroqOnboarding()
  const { seedDefaultHabits } = useHabits(null)

  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('chat')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const bottomRef = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      sendMessage('Hola, quiero crear mi perfil.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (done && extracted) setPhase('pin')
  }, [done, extracted])

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePinComplete = async ({ pin, recoveryWord }) => {
    setSaveError('')

    const normalized = normalizeExtracted(extracted)
    const validationError = validateProfile(normalized)
    if (validationError) {
      setSaveError(validationError)
      return
    }

    setSaving(true)
    try {
      const access_code = await hashPin(pin)
      const recovery_code = await hashPin(recoveryWord)
      const profile = await createProfile({ ...normalized, access_code, recovery_code })
      setActiveProfileId(profile.id)
      unlockProfile(profile.id)
      // Seed default habits silently — don't block navigation on failure
      seedDefaultHabits(profile.id).catch(() => {})
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('createProfile error:', err)
      setSaveError(`Error al guardar: ${err.message || 'Inténtalo de nuevo.'}`)
      setSaving(false)
    }
  }

  if (phase === 'pin') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xs flex flex-col gap-6">

          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">{t('onboarding.phase_pin')}</h2>
          </div>

          {/* Error prominente — visible en móvil sin scroll */}
          {saveError && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-red-700 text-sm text-center">
              {saveError}
            </div>
          )}

          {/* PinSetupStep nunca se desmonta para evitar reset de estado */}
          <div className={saving ? 'opacity-40 pointer-events-none select-none' : ''}>
            <PinSetupStep onComplete={handlePinComplete} />
          </div>

          {saving && (
            <div className="flex flex-col items-center gap-2">
              <Spinner />
              <p className="text-sm text-gray-500">Creando tu perfil...</p>
            </div>
          )}

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {t('common.back')}
        </button>
        <div>
          <p className="font-bold text-gray-900">💚 {t('app_title')}</p>
          <p className="text-xs text-gray-400">{t('onboarding.title')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-br-sm'
                : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <Spinner size="sm" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-red-500 text-sm">{t('onboarding.error_network')}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-4 flex gap-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('onboarding.send')}
          disabled={loading || done}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-primary-500 text-sm disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || done}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-700 transition-colors text-sm"
        >
          {t('onboarding.send_btn')}
        </button>
      </div>

    </div>
  )
}

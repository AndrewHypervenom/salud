import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Smartphone, PartyPopper, Heart } from 'lucide-react'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useGroqOnboarding } from '../../hooks/useGroqOnboarding'
import { useHabits } from '../../hooks/useHabits'
import { hashPin } from '../../lib/crypto'
import { Spinner } from '../../components/ui/Spinner'
import PinSetupStep from './PinSetupStep'
import FitnessWizard from './FitnessWizard'

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

function validateProfile(data, t) {
  if (!data.name || data.name.length < 2) return t('onboarding.valid_name')
  if (isNaN(data.age) || data.age < 1 || data.age > 120) return t('onboarding.valid_age', { val: data.age })
  if (isNaN(data.weight_kg) || data.weight_kg < 20 || data.weight_kg > 300) return t('onboarding.valid_weight', { val: data.weight_kg })
  if (isNaN(data.height_cm) || data.height_cm < 50 || data.height_cm > 250) return t('onboarding.valid_height', { val: data.height_cm })
  if (!['male', 'female'].includes(data.sex)) return t('onboarding.valid_sex', { val: data.sex })
  if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(data.activity)) return t('onboarding.valid_activity', { val: data.activity })
  return null
}

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createProfile, updateProfile } = useProfiles()
  const { setActiveProfileId } = useProfileContext()
  const { unlockProfile } = useAuth()
  const { messages, loading, error, done, extracted, sendMessage } = useGroqOnboarding()
  const { seedDefaultHabits } = useHabits(null)

  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('chat')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newProfileId, setNewProfileId] = useState(null)
  const bottomRef = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      sendMessage(t('onboarding.init_message'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (done && extracted) setPhase('phone')
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
    const validationError = validateProfile(normalized, t)
    if (validationError) {
      setSaveError(validationError)
      return
    }

    setSaving(true)
    try {
      const access_code = await hashPin(pin)
      const recovery_code = await hashPin(recoveryWord)
      const profile = await createProfile({ ...normalized, access_code, recovery_code, phone_whatsapp: phoneNumber.replace(/\D/g, '') })
      setActiveProfileId(profile.id)
      unlockProfile(profile.id)
      setNewProfileId(profile.id)
      setSaving(false)
      setPhase('fitness')
    } catch (err) {
      console.error('createProfile error:', err)
      setSaveError(t('onboarding.save_error_prefix', { msg: err.message || '?' }))
      setSaving(false)
    }
  }

  if (phase === 'fitness') {
    return (
      <FitnessWizard
        profileData={normalizeExtracted(extracted)}
        onComplete={async (fitnessData) => {
          try {
            await updateProfile(newProfileId, fitnessData)
          } catch (err) {
            console.error('fitness profile save failed:', err)
          }
          // Seed habits with fitness data now that we have it
          seedDefaultHabits(newProfileId, fitnessData).catch(() => {})
          navigate('/dashboard', { replace: true })
        }}
        onSkip={() => {
          // Seed default habits without fitness data
          seedDefaultHabits(newProfileId).catch(() => {})
          navigate('/dashboard', { replace: true })
        }}
      />
    )
  }

  if (phase === 'phone') {
    const handlePhoneContinue = () => {
      const digits = phoneNumber.replace(/\D/g, '')
      if (digits.length < 8) {
        setPhoneError(t('onboarding.phone_error'))
        return
      }
      setPhoneError('')
      setPhase('pin')
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs flex flex-col gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Smartphone size={40} strokeWidth={1.5} className="text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('welcome.phone_step_title')}</h2>
            <p className="text-gray-500 mt-2 text-sm">{t('welcome.phone_step_hint')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="tel"
              inputMode="numeric"
              value={phoneNumber}
              onChange={e => { setPhoneNumber(e.target.value); setPhoneError('') }}
              onKeyDown={e => e.key === 'Enter' && handlePhoneContinue()}
              placeholder={t('welcome.phone_placeholder')}
              autoFocus
              autoComplete="tel"
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-2xl focus:outline-none focus:border-primary-500 transition-colors"
            />
            {phoneError && <p className="text-red-500 text-sm text-center">{phoneError}</p>}
          </div>
          <button
            onClick={handlePhoneContinue}
            disabled={!phoneNumber.replace(/\D/g, '')}
            className="w-full py-5 bg-primary-600 text-white text-xl font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-40 transition-all shadow-md"
          >
            {t('welcome.continue')}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'pin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xs flex flex-col gap-6">

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <PartyPopper size={40} strokeWidth={1.5} className="text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('onboarding.phase_pin')}</h2>
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
              <p className="text-sm text-gray-500">{t('onboarding.creating_profile')}</p>
            </div>
          )}

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {t('common.back')}
        </button>
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <Heart size={16} strokeWidth={2} className="text-green-500" />{t('app_title')}
          </p>
          <p className="text-xs text-gray-400">{t('onboarding.title')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 px-4 py-3 rounded-2xl rounded-bl-sm">
              <Spinner size="sm" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-red-500 text-sm">{t('onboarding.error_network')}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-4 flex gap-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('onboarding.send')}
          disabled={loading || done}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:border-primary-500 text-sm disabled:opacity-40"
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

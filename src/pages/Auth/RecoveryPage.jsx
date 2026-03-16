import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { verifyPin, hashPin } from '../../lib/crypto'
import { Spinner } from '../../components/ui/Spinner'
import PinSetupStep from '../Onboarding/PinSetupStep'

const MAX_ATTEMPTS = 3
const LOCKOUT_MS = 5 * 60 * 1000

export default function RecoveryPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { profiles, loading, updateProfile } = useProfiles()
  const { setActiveProfileId } = useProfileContext()
  const { unlockProfile } = useAuth()

  const [word, setWord] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [recovered, setRecovered] = useState(false)
  const [saving, setSaving] = useState(false)

  const profile = profiles.find(p => p.id === id)
  const isLocked = lockedUntil != null && Date.now() < lockedUntil

  useEffect(() => {
    const raw = sessionStorage.getItem(`recovery_lock_${id}`)
    if (raw) {
      const until = parseInt(raw)
      if (Date.now() < until) setLockedUntil(until)
      else sessionStorage.removeItem(`recovery_lock_${id}`)
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || !word.trim() || !profile?.recovery_code) return

    const valid = await verifyPin(word.trim(), profile.recovery_code)
    if (valid) {
      setRecovered(true)
    } else {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS
        setLockedUntil(until)
        sessionStorage.setItem(`recovery_lock_${id}`, String(until))
        setError(t('pin.recovery_locked'))
      } else {
        setError(t('pin.recovery_wrong', { remaining: MAX_ATTEMPTS - next }))
      }
    }
  }

  const handleNewPin = async ({ pin, recoveryWord }) => {
    setSaving(true)
    try {
      const access_code = await hashPin(pin)
      const recovery_code = await hashPin(recoveryWord)
      await updateProfile(id, { access_code, recovery_code })
      setActiveProfileId(id)
      unlockProfile(id)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    )
  }

  if (recovered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xs">
          {saving ? (
            <div className="flex justify-center"><Spinner /></div>
          ) : (
            <PinSetupStep onComplete={handleNewPin} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center gap-6">

        <button
          onClick={() => navigate(-1)}
          className="self-start text-gray-400 hover:text-gray-600 text-sm"
        >
          ← {t('common.back')}
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl">
            {profile ? profile.name[0].toUpperCase() : '?'}
          </div>
          <p className="text-2xl font-bold text-gray-900">{profile?.name}</p>
          <p className="text-gray-500 text-center text-sm">{t('pin.recovery_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            value={word}
            onChange={e => { setWord(e.target.value); setError('') }}
            placeholder={t('pin.recovery_placeholder')}
            disabled={isLocked}
            autoComplete="off"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg focus:outline-none focus:border-primary-500 disabled:opacity-40"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLocked || !word.trim()}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-40 transition-colors"
          >
            {t('pin.recovery_submit')}
          </button>
        </form>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useLoginAttempts } from '../../hooks/useLoginAttempts'
import { verifyPin, hashPin } from '../../lib/crypto'
import { Spinner } from '../../components/ui/Spinner'
import PinSetupStep from '../Onboarding/PinSetupStep'

const MAX_ATTEMPTS = 5

export default function RecoveryPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { profiles, loading, updateProfile } = useProfiles()
  const { setActiveProfileId } = useProfileContext()
  const { unlockProfile } = useAuth()
  const { checkLocked, recordFailure, clearAttempts } = useLoginAttempts()

  const [word, setWord] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [saving, setSaving] = useState(false)

  const profile = profiles.find(p => p.id === id)
  const identifier = `recovery:${id}`

  useEffect(() => {
    checkLocked(identifier).then(({ locked: l }) => setLocked(l))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (locked || !word.trim() || !profile?.recovery_code) return

    const valid = await verifyPin(word.trim(), profile.recovery_code)
    if (valid) {
      await clearAttempts(identifier)
      setRecovered(true)
    } else {
      await recordFailure(identifier)
      const next = attempts + 1
      setAttempts(next)
      const { locked: l, remainingMs } = await checkLocked(identifier)
      if (l) {
        setLocked(true)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner />
      </div>
    )
  }

  if (recovered) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
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
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{profile?.name}</p>
          <p className="text-gray-500 text-center text-sm">{t('pin.recovery_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            value={word}
            onChange={e => { setWord(e.target.value); setError('') }}
            placeholder={t('pin.recovery_placeholder')}
            disabled={locked}
            autoComplete="off"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-center text-lg focus:outline-none focus:border-primary-500 disabled:opacity-40"
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

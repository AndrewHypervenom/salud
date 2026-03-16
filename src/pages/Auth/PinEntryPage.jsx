import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { verifyPin } from '../../lib/crypto'
import { Spinner } from '../../components/ui/Spinner'

const MAX_ATTEMPTS = 3
const LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes

const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinEntryPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { profiles, loading } = useProfiles()
  const { setActiveProfileId } = useProfileContext()
  const { unlockProfile } = useAuth()

  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)

  const profile = profiles.find(p => p.id === id)
  const isLocked = lockedUntil != null && Date.now() < lockedUntil

  // Restore lock from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem(`pin_lock_${id}`)
    if (raw) {
      const until = parseInt(raw)
      if (Date.now() < until) setLockedUntil(until)
      else sessionStorage.removeItem(`pin_lock_${id}`)
    }
  }, [id])

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (pin.length !== 4 || !profile?.access_code) return
    let cancelled = false

    verifyPin(pin, profile.access_code).then(valid => {
      if (cancelled) return
      if (valid) {
        setActiveProfileId(id)
        unlockProfile(id)
        navigate('/dashboard', { replace: true })
      } else {
        setShake(true)
        setPin('')
        setAttempts(prev => {
          const next = prev + 1
          if (next >= MAX_ATTEMPTS) {
            const until = Date.now() + LOCKOUT_MS
            setLockedUntil(until)
            sessionStorage.setItem(`pin_lock_${id}`, String(until))
          }
          return next
        })
        setTimeout(() => setShake(false), 600)
      }
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const handleDigit = (d) => {
    if (isLocked || pin.length >= 4) return
    setPin(prev => prev + d)
  }

  const handleDelete = () => {
    if (!isLocked) setPin(prev => prev.slice(0, -1))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="self-start text-gray-400 hover:text-gray-600 text-sm"
        >
          ← {t('common.back')}
        </button>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl">
            {profile ? profile.name[0].toUpperCase() : '?'}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{profile?.name}</p>
          <p className="text-gray-500 text-sm">{t('pin.enter_title')}</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-100 ${
                i < pin.length ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Status messages */}
        {isLocked && (
          <p className="text-red-600 text-center text-sm">{t('pin.locked_message')}</p>
        )}
        {!isLocked && attempts > 0 && attempts < MAX_ATTEMPTS && (
          <p className="text-red-500 text-sm">{t('pin.wrong')}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {NUMPAD.map((btn, idx) => {
            if (btn === '') return <div key={idx} />
            if (btn === '⌫') {
              return (
                <button
                  key={idx}
                  onClick={handleDelete}
                  disabled={isLocked}
                  aria-label={t('pin.delete')}
                  className="w-full h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-transform disabled:opacity-40"
                >
                  ⌫
                </button>
              )
            }
            return (
              <button
                key={idx}
                onClick={() => handleDigit(btn)}
                disabled={isLocked}
                aria-label={btn}
                className="w-full h-20 rounded-2xl bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-gray-600 flex items-center justify-center text-3xl font-bold text-gray-800 dark:text-gray-100 active:scale-95 transition-transform disabled:opacity-40"
              >
                {btn}
              </button>
            )
          })}
        </div>

        {/* Forgot PIN — shown after max attempts */}
        {attempts >= MAX_ATTEMPTS && (
          <Link
            to={`/profiles/${id}/recover`}
            className="text-primary-600 text-sm underline"
          >
            {t('pin.forgot')}
          </Link>
        )}

      </div>
    </div>
  )
}

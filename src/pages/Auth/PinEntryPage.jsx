import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useLoginAttempts } from '../../hooks/useLoginAttempts'
import { verifyPin } from '../../lib/crypto'

const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinEntryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { setActiveProfileId } = useProfileContext()
  const { unlockProfile } = useAuth()
  const { checkLocked, recordFailure, clearAttempts } = useLoginAttempts()

  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [locked, setLocked] = useState(false)
  const [remainingMins, setRemainingMins] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [tooMany, setTooMany] = useState(false)

  const { profileId, profileName, accessCode, phone } = state || {}

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!profileId || !accessCode) {
      navigate('/', { replace: true })
    }
  }, [profileId, accessCode, navigate])

  // Check server-side lock on mount
  useEffect(() => {
    if (!phone) return
    checkLocked(phone).then(({ locked: l, remainingMs }) => {
      if (l) {
        setLocked(true)
        setRemainingMins(Math.ceil(remainingMs / 60000))
        setTooMany(true)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone])

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (pin.length !== 4 || !accessCode) return
    let cancelled = false

    verifyPin(pin, accessCode).then(async valid => {
      if (cancelled) return
      if (valid) {
        await clearAttempts(phone)
        setActiveProfileId(profileId)
        unlockProfile(profileId)
        navigate('/dashboard', { replace: true })
      } else {
        setShake(true)
        setPin('')
        await recordFailure(phone)
        const next = attempts + 1
        setAttempts(next)
        const { locked: l, remainingMs } = await checkLocked(phone)
        if (l) {
          setLocked(true)
          setRemainingMins(Math.ceil(remainingMs / 60000))
          setTooMany(true)
        }
        setTimeout(() => setShake(false), 600)
      }
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const handleDigit = (d) => {
    if (locked || pin.length >= 4) return
    setPin(prev => prev + d)
  }

  const handleDelete = () => {
    if (!locked) setPin(prev => prev.slice(0, -1))
  }

  if (!profileId) return null

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
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-3xl">
            {profileName ? profileName[0].toUpperCase() : '?'}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{profileName}</p>
          <p className="text-gray-500 text-sm">{t('pin.enter_title')}</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-100 ${
                i < pin.length ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Status messages */}
        {locked && (
          <p className="text-red-600 text-center text-sm">
            {t('pin.locked_message_mins', { mins: remainingMins })}
          </p>
        )}
        {!locked && attempts > 0 && (
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
                  disabled={locked}
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
                disabled={locked}
                aria-label={btn}
                className="w-full h-20 rounded-2xl bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-gray-600 flex items-center justify-center text-3xl font-bold text-gray-800 dark:text-gray-100 active:scale-95 transition-transform disabled:opacity-40"
              >
                {btn}
              </button>
            )
          })}
        </div>

        {/* Forgot PIN — shown after server lockout */}
        {tooMany && (
          <Link
            to={`/profiles/${profileId}/recover`}
            className="text-primary-600 text-sm underline"
          >
            {t('pin.forgot')}
          </Link>
        )}

      </div>
    </div>
  )
}

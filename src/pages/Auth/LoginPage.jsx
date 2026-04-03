import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import nexvidaLogo from '../../assets/favicon.svg'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useLoginAttempts } from '../../hooks/useLoginAttempts'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { findProfileByPhone } = useProfiles()
  const { activeProfileId, setActiveProfileId } = useProfileContext()
  const { isUnlocked, unlockProfile } = useAuth()
  const { checkLocked } = useLoginAttempts()

  const [phone, setPhone] = useState(() => localStorage.getItem('lastPhone') ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already unlocked in session → go to dashboard
  useEffect(() => {
    if (activeProfileId && isUnlocked(activeProfileId)) {
      navigate('/dashboard', { replace: true })
    }
  }, [activeProfileId, isUnlocked, navigate])

  const normalizePhone = (value) => value.replace(/\D/g, '')

  const handleContinue = async () => {
    const normalized = normalizePhone(phone)
    if (!normalized) return
    setError('')
    setLoading(true)
    try {
      const { locked, remainingMs } = await checkLocked(normalized)
      if (locked) {
        const mins = Math.ceil(remainingMs / 60000)
        setError(t('welcome.locked_login', { mins }))
        setLoading(false)
        return
      }

      const profile = await findProfileByPhone(normalized)
      if (!profile) {
        localStorage.removeItem('lastPhone')
        setError(t('welcome.not_found'))
        setLoading(false)
        return
      }

      localStorage.setItem('lastPhone', normalized)

      if (!profile.access_code) {
        // No PIN — login directly
        setActiveProfileId(profile.id)
        unlockProfile(profile.id)
        try { await supabase.from('login_logs').insert({ profile_id: profile.id, source: 'no_pin' }) } catch {}
        navigate('/dashboard', { replace: true })
        return
      }

      navigate('/login/pin', {
        state: { profileId: profile.id, profileName: profile.name, accessCode: profile.access_code, phone: normalized }
      })
    } catch {
      setError(t('welcome.server_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleContinue()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <img src={nexvidaLogo} width="64" height="64" alt="Nexvida logo" className="rounded-2xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('app_title')}</h1>
          <p className="text-gray-500 mt-2 text-lg">{t('welcome.subtitle')}</p>
        </div>

        {/* Phone input */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-medium text-gray-700 dark:text-gray-300">
            {t('welcome.enter_phone')}
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder={t('welcome.phone_placeholder')}
            autoFocus
            autoComplete="tel"
            className="w-full px-5 py-4 text-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-2xl focus:outline-none focus:border-primary-500 transition-colors"
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={loading || !normalizePhone(phone)}
          className="w-full py-5 bg-primary-600 text-white text-xl font-bold rounded-2xl hover:bg-primary-700 active:scale-98 disabled:opacity-40 transition-all shadow-md"
        >
          {loading ? '...' : t('welcome.continue')}
        </button>

        {/* Create account */}
        <button
          onClick={() => navigate('/onboarding/new')}
          className="text-center text-primary-600 dark:text-primary-400 text-base font-medium underline underline-offset-2"
        >
          {t('welcome.create_account')}
        </button>

      </div>
    </div>
  )
}

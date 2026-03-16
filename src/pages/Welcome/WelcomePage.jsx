import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'

export default function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profiles, loading } = useProfiles()
  const { activeProfileId, setActiveProfileId } = useProfileContext()
  const { isUnlocked, unlockProfile } = useAuth()

  // If there is already an active profile unlocked in this session → go straight to dashboard
  useEffect(() => {
    if (!loading && activeProfileId && isUnlocked(activeProfileId)) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, activeProfileId, isUnlocked, navigate])

  const handleSelectProfile = (profile) => {
    if (!profile.access_code) {
      // Legacy profile — no PIN, unlock automatically
      setActiveProfileId(profile.id)
      unlockProfile(profile.id)
      navigate('/dashboard')
    } else if (isUnlocked(profile.id)) {
      setActiveProfileId(profile.id)
      navigate('/dashboard')
    } else {
      navigate(`/profiles/${profile.id}/unlock`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* App header */}
        <div className="text-center">
          <div className="text-5xl mb-3">💚</div>
          <h1 className="text-3xl font-bold text-gray-900">{t('app_title')}</h1>
          <p className="text-gray-500 mt-1">{t('welcome.subtitle')}</p>
        </div>

        {/* Profile list */}
        {profiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider px-1">
              {t('welcome.select_profile')}
            </p>
            {profiles.map(profile => {
              const locked = profile.access_code && !isUnlocked(profile.id)
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="flex items-center gap-4 w-full px-4 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-300 hover:shadow-md transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
                    {profile.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-50 text-lg">{profile.name}</p>
                    <p className="text-sm text-gray-400">{profile.age} {t('profile.years')}</p>
                  </div>
                  {locked && (
                    <span className="text-xl" aria-label={t('pin.locked')}>🔒</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Create new account */}
        <button
          onClick={() => navigate('/onboarding/new')}
          className="flex items-center gap-4 w-full px-4 py-4 bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-400 text-gray-500 hover:text-primary-600 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
            +
          </div>
          <span className="font-medium text-lg">{t('welcome.create_account')}</span>
        </button>

      </div>
    </div>
  )
}

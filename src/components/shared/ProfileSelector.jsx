import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useProfiles } from '../../hooks/useProfiles'

export function ProfileSelector({ onClose }) {
  const { t } = useTranslation()
  const { activeProfileId, setActiveProfileId } = useProfileContext()
  const { isUnlocked, unlockProfile } = useAuth()
  const { profiles } = useProfiles()
  const navigate = useNavigate()

  const handleSelect = (profile) => {
    if (profile.access_code && !isUnlocked(profile.id)) {
      navigate(`/profiles/${profile.id}/unlock`)
      onClose?.()
      return
    }
    setActiveProfileId(profile.id)
    if (!profile.access_code) unlockProfile(profile.id)
    onClose?.()
  }

  return (
    <div className="flex flex-col gap-2">
      {profiles.map(profile => {
        const locked = profile.access_code && !isUnlocked(profile.id)
        return (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-colors ${
              activeProfileId === profile.id
                ? 'bg-primary-50 border-2 border-primary-500'
                : 'hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
              {profile.name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{profile.name}</p>
              <p className="text-sm text-gray-500">{profile.age} {t('profile.years')}</p>
            </div>
            {locked && <span className="text-base" aria-label={t('pin.locked')}>🔒</span>}
          </button>
        )
      })}

      <button
        onClick={() => { navigate('/onboarding/new'); onClose?.() }}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500"
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">+</div>
        <span className="font-medium">{t('profile.add_new')}</span>
      </button>
    </div>
  )
}

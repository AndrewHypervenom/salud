import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'

export function ProfileSelector({ onClose }) {
  const { t } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles(activeProfileId)
  const navigate = useNavigate()

  const profile = profiles[0]

  return (
    <div className="flex flex-col gap-2">
      {profile && (
        <div
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/30"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
            {profile.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.age} {t('profile.years')}</p>
          </div>
        </div>
      )}

      <button
        onClick={() => { navigate(`/profiles/${activeProfileId}/edit`); onClose?.() }}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent text-gray-600 dark:text-gray-300"
      >
        <span className="font-medium">{t('common.edit')}</span>
      </button>
    </div>
  )
}

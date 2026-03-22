import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export default function ProfileList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeProfileId, setActiveProfileId } = useProfileContext()
  const { lockAll } = useAuth()
  const { profiles, loading, deleteProfile } = useProfiles(activeProfileId)

  const handleDelete = async (profile) => {
    if (!confirm(t('profile.delete_confirm'))) return
    await deleteProfile(profile.id)
    lockAll()
    setActiveProfileId(null)
    navigate('/', { replace: true })
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  const profile = profiles[0]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('nav.profiles')}</h1>

      {!profile ? (
        <Card className="text-center py-10 text-gray-400">
          <p className="text-lg">{t('profile.no_profiles')}</p>
        </Card>
      ) : (
        <Card className="border-2 border-primary-400">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
              {profile.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{profile.name}</p>
              <p className="text-sm text-gray-500">
                {profile.age} {t('profile.years')} · {profile.sex === 'female' ? t('profile.sex_female') : t('profile.sex_male')} · {profile.weight_kg}kg
              </p>
              {profile.notes && <p className="text-xs text-gray-400 truncate">{profile.notes}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Button
                variant="secondary"
                className="text-xs px-2 min-h-[36px]"
                onClick={() => navigate(`/profiles/${profile.id}/edit`)}
              >
                {t('common.edit')}
              </Button>
              <Button variant="danger" className="text-xs px-2 min-h-[36px]" onClick={() => handleDelete(profile)}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

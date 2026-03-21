import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { useProfiles } from '../../hooks/useProfiles'
import { useProfileContext } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export default function ProfileList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profiles, loading, deleteProfile } = useProfiles()
  const { activeProfileId, setActiveProfileId } = useProfileContext()
  const { isUnlocked, unlockProfile } = useAuth()

  const handleAvatarClick = (profile) => {
    if (profile.access_code && !isUnlocked(profile.id)) {
      navigate(`/profiles/${profile.id}/unlock`)
      return
    }
    setActiveProfileId(profile.id)
    if (!profile.access_code) unlockProfile(profile.id)
  }

  const handleDelete = async (profile) => {
    if (!confirm(t('profile.delete_confirm'))) return
    await deleteProfile(profile.id)
    if (activeProfileId === profile.id) setActiveProfileId(null)
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.profiles')}</h1>
        <Button onClick={() => navigate('/onboarding/new')}>{t('profile.add_new')}</Button>
      </div>

      {profiles.length === 0 ? (
        <Card className="text-center py-10 text-gray-400">
          <p className="text-lg">{t('profile.no_profiles')}</p>
        </Card>
      ) : (
        profiles.map(profile => {
          const locked = profile.access_code && !isUnlocked(profile.id)
          return (
            <Card key={profile.id} className={`border-2 transition-colors ${activeProfileId === profile.id ? 'border-primary-400' : 'border-transparent'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAvatarClick(profile)}
                  className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0 relative"
                  aria-label={locked ? t('pin.locked') : profile.name}
                >
                  {profile.name[0].toUpperCase()}
                  {locked && (
                    <span className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                      <Lock size={10} strokeWidth={2.5} className="text-gray-500" />
                    </span>
                  )}
                </button>
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
          )
        })
      )}
    </div>
  )
}

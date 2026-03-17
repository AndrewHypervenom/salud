import { useTranslation } from 'react-i18next'
import { useProfileContext } from '../../context/ProfileContext'
import { useBadges, ALL_BADGES } from '../../hooks/useBadges'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

export default function BadgesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { activeProfileId } = useProfileContext()
  const { badges, loading } = useBadges(activeProfileId)

  const getBadge = (key) => badges.find(b => b.badge_key === key)

  if (!activeProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="text-5xl">🏆</span>
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  const unlocked = ALL_BADGES.filter(b => getBadge(b.key))
  const locked = ALL_BADGES.filter(b => !getBadge(b.key))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🏆 {t('badges.title')}</h1>

      <div className="flex gap-2">
        <Card className="flex-1 text-center py-3">
          <p className="text-2xl font-bold text-yellow-500">{unlocked.length}</p>
          <p className="text-xs text-gray-400">{t('badges.unlocked')}</p>
        </Card>
        <Card className="flex-1 text-center py-3">
          <p className="text-2xl font-bold text-gray-400">{locked.length}</p>
          <p className="text-xs text-gray-400">{t('badges.locked')}</p>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <>
          {unlocked.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('badges.unlocked')}</p>
              <div className="grid grid-cols-2 gap-3">
                {unlocked.map(b => {
                  const record = getBadge(b.key)
                  return (
                    <Card key={b.key} className="flex flex-col items-center text-center py-4 gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <span className="text-4xl">{b.emoji}</span>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {lang === 'es' ? b.label_es : b.label_en}
                      </p>
                      {record?.unlocked_at && (
                        <p className="text-xs text-gray-400">
                          {new Date(record.unlocked_at).toLocaleDateString('es', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {locked.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('badges.locked')}</p>
              <div className="grid grid-cols-2 gap-3">
                {locked.map(b => (
                  <Card key={b.key} className="flex flex-col items-center text-center py-4 gap-2 opacity-50">
                    <span className="text-4xl grayscale">{b.emoji}</span>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {lang === 'es' ? b.label_es : b.label_en}
                    </p>
                    <span className="text-lg">🔒</span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

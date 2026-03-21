import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, GlassWater, FlaskConical, Loader2, X } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useProfiles } from '../../hooks/useProfiles'
import { useWaterLogs } from '../../hooks/useWaterLogs'
import { useBadges } from '../../hooks/useBadges'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

const QUICK_OPTIONS = [
  { labelKey: 'water.quick_glass', ml: 250, Icon: GlassWater },
  { labelKey: 'water.quick_small_bottle', ml: 500, Icon: Droplets },
  { labelKey: 'water.quick_large_bottle', ml: 750, Icon: FlaskConical },
]

export default function WaterPage() {
  const { t, i18n } = useTranslation()
  const { activeProfileId } = useProfileContext()
  const { profiles } = useProfiles()
  const profile = profiles.find(p => p.id === activeProfileId)
  const waterGoal = profile?.water_goal_ml || 2000

  const { todayEntries, todayTotal, todayPercent, loading, addWater, deleteWater } = useWaterLogs(activeProfileId, waterGoal)
  const { checkAndUnlock } = useBadges(activeProfileId)
  const [customMl, setCustomMl] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleAdd = async (ml) => {
    if (!ml || ml <= 0) return
    setAdding(true)
    try {
      await addWater(ml)
      const newTotal = todayTotal + ml
      await checkAndUnlock('first_water', true)
      await checkAndUnlock('hydrated_1', newTotal >= waterGoal)
    } catch (e) { console.error(e) }
    setAdding(false)
  }

  const handleCustom = () => {
    const val = parseInt(customMl)
    if (val > 0) {
      handleAdd(val)
      setCustomMl('')
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try { await deleteWater(id) } catch (e) { console.error(e) }
    setDeleting(null)
  }

  if (!activeProfileId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Droplets size={48} strokeWidth={1.5} className="text-blue-300" />
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  const remaining = Math.max(waterGoal - todayTotal, 0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="ios-title text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Droplets size={26} strokeWidth={1.75} style={{ color: '#007AFF' }} />
        {t('water.title')}
      </h1>

      {/* Progress ring principal */}
      <Card className="flex flex-col items-center py-6 gap-3 bg-gradient-to-br from-white to-blue-50/40 dark:from-ios-dark dark:to-ios-dark2">
        <ProgressRing percent={todayPercent} size={160} strokeWidth={12} color="#007AFF" trackColor="rgba(0,122,255,0.1)">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#007AFF' }}>{todayTotal}</p>
            <p className="text-xs text-ios-gray">ml</p>
          </div>
        </ProgressRing>
        <p className="text-sm text-ios-gray">
          {todayPercent >= 100
            ? t('water.goal_met')
            : t('water.remaining', { remaining, goal: waterGoal })}
        </p>
      </Card>

      {/* Botones rápidos */}
      <div>
        <p className="ios-section-label mb-2">{t('water.quick_add')}</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_OPTIONS.map(opt => (
            <button
              key={opt.ml}
              onClick={() => handleAdd(opt.ml)}
              disabled={adding}
              className="flex flex-col items-center gap-1.5 py-4 rounded-2xl text-white disabled:opacity-40 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(145deg, #1A8FFF, #0055D4)', boxShadow: '0 6px 16px rgba(0,122,255,0.30)' }}
            >
              <opt.Icon size={24} strokeWidth={1.75} />
              <span className="text-xs font-semibold">{t(opt.labelKey)}</span>
              <span className="text-xs text-white/70">+{opt.ml}ml</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cantidad personalizada */}
      <Card>
        <p className="ios-section-label mb-2">{t('water.custom_amount')}</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={customMl}
            onChange={e => setCustomMl(e.target.value)}
            placeholder={t('water.ml_placeholder')}
            min="1"
            max="2000"
            className="flex-1 px-3 py-2 text-sm border border-black/10 dark:border-white/10 bg-black/4 dark:bg-white/6 dark:text-gray-200 rounded-xl focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && handleCustom()}
          />
          <button
            onClick={handleCustom}
            disabled={!customMl || parseInt(customMl) <= 0 || adding}
            className="px-4 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-all active:scale-95"
            style={{ background: 'linear-gradient(145deg, #1A8FFF, #0055D4)' }}
          >
            {adding ? <Spinner size="sm" /> : `+ ${t('water.add_btn')}`}
          </button>
        </div>
      </Card>

      {/* Lista del día */}
      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : todayEntries.length > 0 && (
        <div>
          <p className="ios-section-label mb-2">{t('water.today_log')}</p>
          <div className="flex flex-col gap-2">
            {todayEntries.map(entry => (
              <Card key={entry.id} className="flex items-center gap-3 py-2.5">
                <Droplets size={20} strokeWidth={1.75} style={{ color: '#007AFF' }} className="flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#007AFF' }}>{entry.amount_ml} ml</p>
                  <p className="text-xs text-ios-gray">
                    {new Date(entry.logged_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="text-ios-gray/40 hover:text-ios-red transition-colors p-1"
                >
                  {deleting === entry.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

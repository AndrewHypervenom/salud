import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Lock, ChevronRight, ChevronDown } from 'lucide-react'
import { useProfileContext } from '../../context/ProfileContext'
import { useBadges, ALL_BADGES, BADGE_CATEGORIES } from '../../hooks/useBadges'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { BadgeDetailModal } from '../../components/shared/BadgeDetailModal'

const DIFFICULTY_DOT = {
  easy:   'bg-green-400',
  medium: 'bg-yellow-400',
  hard:   'bg-orange-500',
  elite:  'bg-purple-600',
}

function BadgeCard({ badge, record, stat, lang, onSelect }) {
  const isUnlocked = !!record
  const label = lang === 'es' ? badge.label_es : badge.label_en
  const desc  = lang === 'es' ? badge.desc_es  : badge.desc_en

  const BadgeIcon = badge.Icon

  if (isUnlocked) {
    return (
      <button
        onClick={() => onSelect({ badge, record, stat: stat ?? null })}
        aria-label={label}
        className="flex flex-col items-center text-center p-3 gap-1.5 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 cursor-pointer active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full"
      >
        <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
          {BadgeIcon && <BadgeIcon size={22} strokeWidth={1.75} />}
        </div>
        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{label}</p>
        {record?.created_at && (
          <p className="text-xs text-gray-400">
            {new Date(record.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
          </p>
        )}
        <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[badge.difficulty]}`} />
      </button>
    )
  }

  return (
    <button
      onClick={() => onSelect({ badge, record: null, stat: stat ?? null })}
      aria-label={label}
      className="flex flex-col items-center text-center p-3 gap-1.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 opacity-60 cursor-pointer active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-400 w-full"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
        {BadgeIcon && <BadgeIcon size={22} strokeWidth={1.75} />}
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{desc}</p>
      {stat && (
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {Math.round(stat.current)}/{stat.total}
        </p>
      )}
      <div className="flex items-center gap-1">
        <Lock size={11} strokeWidth={2} className="text-gray-400" />
        <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[badge.difficulty]}`} />
      </div>
    </button>
  )
}

function CategorySection({ category, badges, getBadge, badgeStats, lang, t, onSelect }) {
  const [collapsed, setCollapsed] = useState(false)
  const categoryBadges = badges.filter(b => b.category === category)
  const unlockedCount = categoryBadges.filter(b => getBadge(b.key)).length

  const catLabel = t(`badges.categories.${category}`)

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {catLabel}
          </span>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
            {unlockedCount}/{categoryBadges.length}
          </span>
        </div>
        {collapsed
          ? <ChevronRight size={16} strokeWidth={2} className="text-gray-400" />
          : <ChevronDown size={16} strokeWidth={2} className="text-gray-400" />
        }
      </button>

      {!collapsed && (
        <div className="grid grid-cols-2 gap-2">
          {categoryBadges.map(b => (
            <BadgeCard
              key={b.key}
              badge={b}
              record={getBadge(b.key)}
              stat={badgeStats[b.key]}
              lang={lang}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BadgesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { activeProfileId } = useProfileContext()
  const { badges, loading, runChecks, badgeStats } = useBadges(activeProfileId)
  const [selectedBadge, setSelectedBadge] = useState(null)

  useEffect(() => {
    if (activeProfileId) runChecks()
  }, [activeProfileId]) // eslint-disable-line

  const getBadge = (key) => badges.find(b => b.badge_key === key)
  const unlockedCount = ALL_BADGES.filter(b => getBadge(b.key)).length
  const totalCount = ALL_BADGES.length
  const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  if (!activeProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Trophy size={48} strokeWidth={1.5} className="text-yellow-400" />
        <p className="text-gray-500">{t('common.select_profile_first')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Trophy size={26} strokeWidth={1.75} className="text-yellow-500" />
        {t('badges.title')}
      </h1>

      {/* Stats bar */}
      <Card className="flex flex-col gap-2 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('badges.total_progress', { n: unlockedCount, total: totalCount })}
          </p>
          <p className="text-sm font-bold text-yellow-500">{Math.round(progressPct)}%</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-yellow-400 h-3 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-3 mt-1">
          {[
            { diff: 'easy',   label: t('badges.difficulty.easy') },
            { diff: 'medium', label: t('badges.difficulty.medium') },
            { diff: 'hard',   label: t('badges.difficulty.hard') },
            { diff: 'elite',  label: t('badges.difficulty.elite') },
          ].map(({ diff, label }) => (
            <div key={diff} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[diff]}`} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {BADGE_CATEGORIES.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              badges={ALL_BADGES}
              getBadge={getBadge}
              badgeStats={badgeStats}
              lang={lang}
              t={t}
              onSelect={setSelectedBadge}
            />
          ))}
        </div>
      )}

      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge.badge}
          record={selectedBadge.record}
          stat={selectedBadge.stat}
          lang={lang}
          t={t}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  )
}

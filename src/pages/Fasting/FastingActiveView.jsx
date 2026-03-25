import { useTranslation } from 'react-i18next'
import { Pencil, Check } from 'lucide-react'
import FastingMascot from '../../components/fasting/FastingMascot'
import FastingProgressRingGradient from '../../components/fasting/FastingProgressRingGradient'
import { FASTING_PHASES } from '../../components/fasting/fastingPhases'
import { ElapsedTimer } from '../../components/ui/CountdownTimer'
import { Spinner } from '../../components/ui/Spinner'
import { useTheme } from '../../context/ThemeContext'

const PHASE_ICONS = ['🍽️', '🔋', '🔥', '⚡', '✨']

export default function FastingActiveView({
  activeSession,
  activePercent,
  phaseIndex,
  targetEndTime,
  ending,
  reaction,
  editingId,
  editStart,
  editEnd,
  savingEdit,
  onEnd,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  setEditStart,
  setEditEnd,
}) {
  const { t, i18n } = useTranslation()
  const { isDark } = useTheme()

  const phase = FASTING_PHASES[phaseIndex] ?? FASTING_PHASES[0]
  const [bgFrom, bgTo] = isDark ? phase.bgDark : phase.bgLight

  const glassCard = isDark
    ? { background: 'rgba(28,28,30,0.82)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }
    : { background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(255,255,255,0.55)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)' }

  return (
    <div
      className="flex flex-col gap-4 rounded-3xl p-1 transition-all duration-1000"
      style={{ background: `linear-gradient(160deg, ${bgFrom} 0%, ${bgTo} 100%)` }}
    >
      {/* Phase pill label */}
      <div className="flex justify-center pt-4">
        <span
          className="ios-section-label px-3 py-1 rounded-full animate-phase-slide-in"
          key={phaseIndex}
          style={{ backgroundColor: `${phase.primary}22`, color: phase.primary }}
        >
          {PHASE_ICONS[phaseIndex]} {t(phase.labelKey)}
        </span>
      </div>

      {/* Main frosted card */}
      <div
        className="flex flex-col items-center gap-4 rounded-3xl px-6 py-6 mx-2"
        style={{
          ...glassCard,
          boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px ${phase.glow}33`,
        }}
      >
        {/* Mascot */}
        <FastingMascot phaseIndex={phaseIndex} reaction={reaction} sleeping={false} />

        {/* Progress ring */}
        <FastingProgressRingGradient percent={activePercent} size={200} strokeWidth={16} phaseIndex={phaseIndex}>
          <div className="text-center" style={{ color: phase.primary }}>
            <p className="text-xs font-medium mb-1">{t('fasting.elapsed')}</p>
            <ElapsedTimer
              startTime={activeSession.start_time}
              className="text-2xl font-bold tabular-nums"
            />
          </div>
        </FastingProgressRingGradient>

        {/* Meta info */}
        <div className="text-center">
          <p className="ios-subhead text-gray-600 dark:text-gray-300 font-medium">
            {t('fasting.meta_progress', { h: activeSession.target_hours, pct: Math.round(activePercent) })}
          </p>
          {targetEndTime && (
            <p className="ios-caption mt-0.5">
              {t('fasting.end_time_est', {
                time: new Date(targetEndTime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }),
              })}
            </p>
          )}
        </div>
      </div>

      {/* Phase info card */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 mx-2 animate-phase-slide-in"
        key={`phase-info-${phaseIndex}`}
        style={{
          ...glassCard,
          boxShadow: 'none',
        }}
      >
        <span className="text-2xl">{PHASE_ICONS[phaseIndex]}</span>
        <div>
          <p className="ios-headline" style={{ color: phase.primary }}>{t(phase.labelKey)}</p>
          <p className="ios-footnote text-gray-500 dark:text-gray-400">{t(phase.descKey)}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-2 pb-2">
        <button
          onClick={onStartEdit}
          className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95"
          style={{
            border: `1.5px solid ${phase.primary}`,
            color: phase.primary,
            backgroundColor: `${phase.primary}10`,
          }}
        >
          <Pencil size={14} strokeWidth={2} className="inline mr-1" />
          {t('fasting.edit_times')}
        </button>
        <button
          onClick={onEnd}
          disabled={ending}
          className="flex-1 py-3 rounded-full text-sm font-bold text-white transition-all duration-150 active:scale-95 disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${phase.primary}, ${phase.darkPrimary ?? phase.primary})`,
            boxShadow: `0 4px 16px ${phase.primary}55`,
          }}
        >
          {ending ? <Spinner size="sm" /> : <><Check size={16} strokeWidth={2.5} className="inline mr-1" />{t('fasting.end')}</>}
        </button>
      </div>

      {/* Inline edit panel */}
      {editingId === activeSession.id && (
        <div className="mx-2 mb-2 flex flex-col gap-3 rounded-2xl px-4 py-4" style={glassCard}>
          <p className="ios-section-label">{t('fasting.edit_times')}</p>
          <div className="flex flex-col gap-2">
            <label className="ios-footnote text-gray-500">{t('fasting.start_time')}</label>
            <input
              type="datetime-local"
              value={editStart}
              onChange={e => setEditStart(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl"
            />
            <label className="ios-footnote text-gray-500">{t('fasting.end_time')} {t('fasting.optional')}</label>
            <input
              type="datetime-local"
              value={editEnd}
              onChange={e => setEditEnd(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancelEdit}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onSaveEdit}
              disabled={savingEdit}
              className="flex-1 py-2 rounded-full text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-40"
              style={{ backgroundColor: phase.primary }}
            >
              {savingEdit ? <Spinner size="sm" /> : t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

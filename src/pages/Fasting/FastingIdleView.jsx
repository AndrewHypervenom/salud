import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import FastingMascot from '../../components/fasting/FastingMascot'
import { FASTING_PHASES, getPhaseIndex } from '../../components/fasting/fastingPhases'
import { Spinner } from '../../components/ui/Spinner'
import { useTheme } from '../../context/ThemeContext'

const TARGET_OPTIONS = [12, 14, 16, 18, 20, 24]

// Returns the phase index that best represents a given target duration
function previewPhase(targetHours) {
  // Preview the phase they'll eventually reach near the end of their fast
  const midpoint = targetHours * 0.6
  return getPhaseIndex(midpoint)
}

export default function FastingIdleView({ targetHours, setTargetHours, handleStart, starting }) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const phaseIdx = previewPhase(targetHours)
  const phase = FASTING_PHASES[phaseIdx]

  return (
    <div
      className="flex flex-col items-center gap-6 rounded-3xl p-6 transition-all duration-700"
      style={{
        background: `linear-gradient(160deg, ${isDark ? phase.bgDark[0] : phase.bgLight[0]} 0%, ${isDark ? phase.bgDark[1] : phase.bgLight[1]} 100%)`,
      }}
    >
      {/* Mascota dormida */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <FastingMascot phaseIndex={phaseIdx} sleeping reaction="idle" />
        <p className="ios-caption mt-1">{t('fasting.no_active')}</p>
      </div>

      {/* Título */}
      <div className="text-center">
        <p className="ios-title2 text-gray-800 dark:text-gray-100">{t('fasting.start')}</p>
        <p className="ios-subhead text-gray-500 dark:text-gray-400 mt-0.5">{t('fasting.target_hours')}</p>
      </div>

      {/* Selector de duración */}
      <div className="grid grid-cols-6 gap-2 w-full">
        {TARGET_OPTIONS.map(h => {
          const pIdx = previewPhase(h)
          const p = FASTING_PHASES[pIdx]
          const selected = targetHours === h
          return (
            <button
              key={h}
              onClick={() => setTargetHours(h)}
              className="py-2.5 rounded-full text-sm font-semibold transition-all duration-300 active:scale-90"
              style={selected ? {
                backgroundColor: p.primary,
                color: 'white',
                boxShadow: `0 4px 12px ${p.primary}55`,
              } : {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: isDark ? '#d1d5db' : '#374151',
              }}
            >
              {h}h
            </button>
          )
        })}
      </div>

      {/* Indicador de fase destino */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-phase-slide-in"
        style={{ backgroundColor: `${phase.primary}18`, color: phase.primary }}
        key={phaseIdx}
      >
        <span style={{ fontSize: 16 }}>{phaseEmoji(phaseIdx)}</span>
        <span>{t(phase.labelKey)}</span>
      </div>

      {/* Botón iniciar */}
      <button
        onClick={handleStart}
        disabled={starting}
        className="w-full py-4 rounded-full text-base font-bold text-white transition-all duration-300 active:scale-95 disabled:opacity-40"
        style={{
          background: `linear-gradient(135deg, ${phase.primary} 0%, ${phase.glow === '#FEF08A' ? phase.primary : phase.glow} 100%)`,
          boxShadow: `0 6px 20px ${phase.primary}55`,
        }}
      >
        {starting ? (
          <Spinner size="sm" />
        ) : (
          <>
            <Zap size={18} strokeWidth={2} className="inline mr-1.5" />
            {t('fasting.start_fast_x', { h: targetHours })}
          </>
        )}
      </button>
    </div>
  )
}

function phaseEmoji(idx) {
  return ['🍽️', '🔋', '🔥', '⚡', '✨'][idx] ?? '⚡'
}

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDashboardConfig, NAV_CATALOG } from '../../hooks/useDashboardConfig'

// ── Fixed items — no personalizables ─────────────────────────────────────────
const HOME_ITEM   = { key: 'dashboard', to: '/dashboard', label: 'nav.dashboard', icon: '🏠' }
const MORE_LABEL  = { key: '_more', label: 'nav.more', icon: '⋯' }

const moreItems = [
  { to: '/progress',        label: 'nav.progress',        icon: '📈' },
  { to: '/calories',        label: 'nav.calories',        icon: '🔥' },
  { to: '/diet',            label: 'nav.diet',            icon: '🥗' },
  { to: '/exercise',        label: 'nav.exercise',        icon: '🏃' },
  { to: '/doctor-questions',label: 'nav.doctor_questions',icon: '👨‍⚕️' },
  { to: '/profiles',        label: 'nav.profiles',        icon: '👥' },
]
const toolItems = [
  { to: '/water',       label: 'nav.water',       icon: '💧' },
  { to: '/weight',      label: 'nav.weight',      icon: '⚖️' },
  { to: '/fasting',     label: 'nav.fasting',     icon: '⚡' },
  { to: '/recipes',     label: 'nav.recipes',     icon: '👨‍🍳' },
  { to: '/food-search', label: 'nav.food_search', icon: '🔍' },
  { to: '/badges',      label: 'nav.badges',      icon: '🏆' },
]

// ── NavCustomizer sheet ───────────────────────────────────────────────────────
function NavCustomizer({ shortcuts, onSetShortcut, onClose }) {
  const { t } = useTranslation()
  const [editingSlot, setEditingSlot] = useState(null) // 0|1|2

  const getItem = (key) => NAV_CATALOG.find(n => n.key === key)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{t('nav.customize_title')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t('nav.customize_hint')}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          ✕
        </button>
      </div>

      {/* Preview of current bar */}
      <div className="flex gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
        {/* Home fixed */}
        <div className="flex-1 flex flex-col items-center gap-1 opacity-40">
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] text-gray-500 font-medium">Inicio</span>
          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">Fijo</span>
        </div>

        {/* 3 editable slots */}
        {shortcuts.map((key, i) => {
          const item = getItem(key)
          const isEditing = editingSlot === i
          return (
            <button
              key={i}
              onClick={() => setEditingSlot(isEditing ? null : i)}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl transition-all ${
                isEditing
                  ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{item?.icon ?? '?'}</span>
              <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium leading-tight text-center">
                {item ? t(item.label) : '—'}
              </span>
              <span className="text-[9px] text-primary-500 font-semibold px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                Editar
              </span>
            </button>
          )
        })}

        {/* More fixed */}
        <div className="flex-1 flex flex-col items-center gap-1 opacity-40">
          <span className="text-2xl">⋯</span>
          <span className="text-[10px] text-gray-500 font-medium">Más</span>
          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">Fijo</span>
        </div>
      </div>

      {/* Item picker */}
      {editingSlot !== null && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Elige para posición {editingSlot + 2}
          </p>
          <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
            {NAV_CATALOG.map(item => {
              const isActive = item.key === shortcuts[editingSlot]
              const isUsedElsewhere = shortcuts.some((k, idx) => k === item.key && idx !== editingSlot)
              return (
                <button
                  key={item.key}
                  disabled={isUsedElsewhere}
                  onClick={() => {
                    onSetShortcut(editingSlot, item.key)
                    setEditingSlot(null)
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400'
                      : isUsedElsewhere
                      ? 'opacity-30 cursor-not-allowed bg-gray-50 dark:bg-gray-800/30'
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium leading-tight text-center">
                    {t(item.label)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main BottomNav ────────────────────────────────────────────────────────────
export function BottomNav() {
  const { t } = useTranslation()
  const { shortcuts, setShortcutAt } = useDashboardConfig()
  const [showMore, setShowMore] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)

  // Build the 3 shortcut items from nav catalog
  const shortcutItems = shortcuts.map(key => NAV_CATALOG.find(n => n.key === key)).filter(Boolean)

  const NavItem = ({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ${
          isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`text-[22px] transition-transform ${isActive ? 'scale-110' : ''}`}>{icon}</span>
          <span className="text-[10px] font-medium leading-tight">{t(label)}</span>
          {isActive && <span className="absolute top-1 w-1 h-1 rounded-full bg-primary-500" />}
        </>
      )}
    </NavLink>
  )

  return (
    <>
      {/* ── MORE DRAWER ───────────────────────────────────── */}
      {showMore && !showCustomizer && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end md:hidden"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-28 max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-5" />

            {/* Personalizar barra */}
            <button
              onClick={() => setShowCustomizer(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 mb-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-lg flex-shrink-0">🎛️</div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">{t('nav.customize_title')}</p>
                <p className="text-xs text-primary-500/70 dark:text-primary-400/60">{t('nav.customize_hint')}</p>
              </div>
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('nav.more')}</p>
            {moreItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`
                }
              >
                <span className="text-2xl w-8 text-center">{item.icon}</span>
                <span className="font-medium text-sm">{t(item.label)}</span>
              </NavLink>
            ))}

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">{t('nav.tools')}</p>
            {toolItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`
                }
              >
                <span className="text-2xl w-8 text-center">{item.icon}</span>
                <span className="font-medium text-sm">{t(item.label)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* ── CUSTOMIZER SHEET ──────────────────────────────── */}
      {showCustomizer && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
          onClick={() => setShowCustomizer(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-5" />
            <NavCustomizer
              shortcuts={shortcuts}
              onSetShortcut={setShortcutAt}
              onClose={() => { setShowCustomizer(false); setShowMore(false) }}
            />
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800 flex md:hidden">
        {/* Home — always first */}
        <NavItem to="/dashboard" icon="🏠" label="nav.dashboard" />

        {/* 3 personalizables */}
        {shortcutItems.map(item => (
          <NavItem key={item.key} to={item.to} icon={item.icon} label={item.label} />
        ))}

        {/* More — always last */}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 dark:text-gray-500 transition-colors active:text-gray-600"
        >
          <span className="text-[22px] font-bold">⋯</span>
          <span className="text-[10px] font-medium leading-tight">{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}

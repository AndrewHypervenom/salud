import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDashboardConfig, NAV_CATALOG } from '../../hooks/useDashboardConfig'
import { NavIcon } from '../../lib/navIcons'
import { MoreHorizontal, SlidersHorizontal } from 'lucide-react'

// ── Fixed items — no personalizables ─────────────────────────────────────────
const HOME_ITEM   = { key: 'dashboard', to: '/dashboard', label: 'nav.dashboard' }
const MORE_LABEL  = { key: '_more', label: 'nav.more' }

const moreItems = [
  { key: 'progress',         to: '/progress',         label: 'nav.progress' },
  { key: 'calories',         to: '/calories',         label: 'nav.calories' },
  { key: 'diet',             to: '/diet',             label: 'nav.diet' },
  { key: 'exercise',         to: '/exercise',         label: 'nav.exercise' },
  { key: 'doctor-questions', to: '/doctor-questions', label: 'nav.doctor_questions' },
  { key: 'profiles',         to: '/profiles',         label: 'nav.profiles' },
]
const toolItems = [
  { key: 'water',       to: '/water',       label: 'nav.water' },
  { key: 'weight',      to: '/weight',      label: 'nav.weight' },
  { key: 'fasting',     to: '/fasting',     label: 'nav.fasting' },
  { key: 'recipes',     to: '/recipes',     label: 'nav.recipes' },
  { key: 'food-search', to: '/food-search', label: 'nav.food_search' },
  { key: 'badges',      to: '/badges',      label: 'nav.badges' },
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
      <div className="flex gap-2 bg-black/5 dark:bg-white/5 rounded-2xl p-3">
        {/* Home fixed */}
        <div className="flex-1 flex flex-col items-center gap-1 opacity-40">
          <NavIcon navKey="dashboard" size={22} className="text-gray-500" />
          <span className="text-[10px] text-gray-500 font-medium">{t('nav.dashboard')}</span>
          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">{t('nav.fixed')}</span>
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
                  ? 'bg-ios-orange/15 ring-2 ring-ios-orange/50'
                  : 'hover:bg-black/5 dark:hover:bg-white/8'
              }`}
            >
              <NavIcon navKey={item?.key} size={22} className="text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium leading-tight text-center">
                {item ? t(item.label) : '—'}
              </span>
              <span className="text-[9px] text-ios-orange font-semibold px-1.5 py-0.5 bg-ios-orange/10 rounded-full">
                {t('common.edit')}
              </span>
            </button>
          )
        })}

        {/* More fixed */}
        <div className="flex-1 flex flex-col items-center gap-1 opacity-40">
          <MoreHorizontal size={22} strokeWidth={1.75} className="text-gray-500" />
          <span className="text-[10px] text-gray-500 font-medium">{t('nav.more')}</span>
          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">{t('nav.fixed')}</span>
        </div>
      </div>

      {/* Item picker */}
      {editingSlot !== null && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {t('nav.position_hint', { n: editingSlot + 2 })}
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
                      ? 'bg-ios-orange/15 ring-2 ring-ios-orange/40'
                      : isUsedElsewhere
                      ? 'opacity-30 cursor-not-allowed bg-black/3 dark:bg-white/3'
                      : 'bg-black/4 dark:bg-white/5 hover:bg-ios-orange/10 active:scale-95'
                  }`}
                >
                  <NavIcon navKey={item.key} size={22} className={isActive ? 'text-ios-orange' : 'text-ios-gray dark:text-ios-gray'} />
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

  const NavItem = ({ to, navKey, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-150 relative ${
          isActive ? 'text-ios-orange' : 'text-ios-gray dark:text-ios-gray'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
            <NavIcon navKey={navKey} size={22} strokeWidth={isActive ? 2.25 : 1.75} />
          </span>
          <span className={`text-[10px] leading-tight transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>
            {t(label)}
          </span>
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
            className="relative bg-ios-bg dark:bg-ios-dark rounded-t-3xl p-6 pb-28 max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-5" />

            {/* Personalizar barra */}
            <button
              onClick={() => setShowCustomizer(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 mb-4 bg-ios-orange/10 dark:bg-ios-orange/15 rounded-2xl border border-ios-orange/20 dark:border-ios-orange/20 hover:bg-ios-orange/15 transition-colors active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-ios-orange/15 flex items-center justify-center flex-shrink-0 text-ios-orange">
                <SlidersHorizontal size={20} strokeWidth={1.75} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-ios-orange">{t('nav.customize_title')}</p>
                <p className="text-xs text-ios-orange/60">{t('nav.customize_hint')}</p>
              </div>
              <svg className="w-4 h-4 text-ios-orange/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <p className="ios-section-label mb-3">{t('nav.more')}</p>
            {moreItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 transition-colors ${
                    isActive
                      ? 'bg-ios-orange/10 text-ios-orange dark:bg-ios-orange/15 font-semibold'
                      : 'text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/8'
                  }`
                }
              >
                <span className="w-8 flex justify-center">
                  <NavIcon navKey={item.key} size={20} />
                </span>
                <span className="font-medium text-sm">{t(item.label)}</span>
              </NavLink>
            ))}

            <p className="ios-section-label mb-3 mt-5">{t('nav.tools')}</p>
            {toolItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 transition-colors ${
                    isActive
                      ? 'bg-ios-orange/10 text-ios-orange dark:bg-ios-orange/15 font-semibold'
                      : 'text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/8'
                  }`
                }
              >
                <span className="w-8 flex justify-center">
                  <NavIcon navKey={item.key} size={20} />
                </span>
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
            className="relative bg-ios-bg dark:bg-ios-dark rounded-t-3xl p-6 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-5" />
            <NavCustomizer
              shortcuts={shortcuts}
              onSetShortcut={setShortcutAt}
              onClose={() => { setShowCustomizer(false); setShowMore(false) }}
            />
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 glass-nav border-t border-black/8 dark:border-white/8 flex md:hidden pb-safe">
        {/* Home — always first */}
        <NavItem to="/dashboard" navKey="dashboard" label="nav.dashboard" />

        {/* 3 personalizables */}
        {shortcutItems.map(item => (
          <NavItem key={item.key} to={item.to} navKey={item.key} label={item.label} />
        ))}

        {/* More — always last */}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ios-gray transition-all active:scale-95"
        >
          <MoreHorizontal size={22} strokeWidth={1.75} />
          <span className="text-[10px] font-medium leading-tight">{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}

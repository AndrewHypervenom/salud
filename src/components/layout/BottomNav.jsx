import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const mainItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: '🏠' },
  { to: '/habits', label: 'nav.habits', icon: '✅' },
  { to: '/food', label: 'nav.food', icon: '🍽️' },
  { to: '/blood-pressure', label: 'nav.blood_pressure', icon: '❤️' },
]

const moreItems = [
  { to: '/calories', label: 'nav.calories', icon: '🔥' },
  { to: '/diet', label: 'nav.diet', icon: '🥗' },
  { to: '/exercise', label: 'nav.exercise', icon: '🏃' },
  { to: '/doctor-questions', label: 'nav.doctor_questions', icon: '👨‍⚕️' },
  { to: '/profiles', label: 'nav.profiles', icon: '👥' },
]

export function BottomNav() {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-24"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">{t('nav.more')}</h3>
            {moreItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 ${
                    isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{t(item.label)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex md:hidden">
        {mainItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 transition-colors ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'
              }`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-medium leading-tight">{t(item.label)}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 text-gray-500"
        >
          <span className="text-2xl">⋯</span>
          <span className="font-medium leading-tight">{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}

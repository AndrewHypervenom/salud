import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const mainItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: '🏠' },
  { to: '/habits', label: 'nav.habits', icon: '✅' },
  { to: '/food', label: 'nav.food', icon: '🍽️' },
  { to: '/progress', label: 'nav.progress', icon: '📈' },
  { to: '/calories', label: 'nav.calories', icon: '🔥' },
  { to: '/blood-pressure', label: 'nav.blood_pressure', icon: '❤️' },
  { to: '/diet', label: 'nav.diet', icon: '🥗' },
  { to: '/exercise', label: 'nav.exercise', icon: '🏃' },
  { to: '/doctor-questions', label: 'nav.doctor_questions', icon: '👨‍⚕️' },
  { to: '/profiles', label: 'nav.profiles', icon: '👥' },
]

const toolItems = [
  { to: '/water', label: 'nav.water', icon: '💧' },
  { to: '/weight', label: 'nav.weight', icon: '⚖️' },
  { to: '/fasting', label: 'nav.fasting', icon: '⚡' },
  { to: '/recipes', label: 'nav.recipes', icon: '👨‍🍳' },
  { to: '/food-search', label: 'nav.food_search', icon: '🔍' },
  { to: '/badges', label: 'nav.badges', icon: '🏆' },
]

function NavItem({ item, t }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        }`
      }
    >
      <span className="text-xl">{item.icon}</span>
      {t(item.label)}
    </NavLink>
  )
}

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen pt-4 overflow-y-auto">
      <nav className="flex flex-col gap-1 px-3">
        {mainItems.map(item => <NavItem key={item.to} item={item} t={t} />)}

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 pt-4 pb-1">
          {t('nav.tools')}
        </p>
        {toolItems.map(item => <NavItem key={item.to} item={item} t={t} />)}
      </nav>
    </aside>
  )
}

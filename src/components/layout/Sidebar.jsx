import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NavIcon } from '../../lib/navIcons'

const mainItems = [
  { to: '/dashboard', label: 'nav.dashboard', navKey: 'dashboard' },
  { to: '/habits', label: 'nav.habits', navKey: 'habits' },
  { to: '/food', label: 'nav.food', navKey: 'food' },
  { to: '/progress', label: 'nav.progress', navKey: 'progress' },
  { to: '/calories', label: 'nav.calories', navKey: 'calories' },
  { to: '/blood-pressure', label: 'nav.blood_pressure', navKey: 'blood-pressure' },
  { to: '/diet', label: 'nav.diet', navKey: 'diet' },
  { to: '/exercise', label: 'nav.exercise', navKey: 'exercise' },
  { to: '/doctor-questions', label: 'nav.doctor_questions', navKey: 'doctor-questions' },
  { to: '/profiles', label: 'nav.profiles', navKey: 'profiles' },
]

const toolItems = [
  { to: '/water', label: 'nav.water', navKey: 'water' },
  { to: '/weight', label: 'nav.weight', navKey: 'weight' },
  { to: '/fasting', label: 'nav.fasting', navKey: 'fasting' },
  { to: '/recipes', label: 'nav.recipes', navKey: 'recipes' },
  { to: '/food-search', label: 'nav.food_search', navKey: 'food-search' },
  { to: '/badges', label: 'nav.badges', navKey: 'badges' },
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
      <NavIcon navKey={item.navKey} size={20} />
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

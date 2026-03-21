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
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-ios-orange/10 text-ios-orange dark:bg-ios-orange/15 dark:text-ios-orange font-semibold'
            : 'text-gray-600 hover:bg-black/5 hover:text-gray-900 dark:text-ios-gray dark:hover:bg-white/8 dark:hover:text-gray-100'
        }`
      }
    >
      <NavIcon navKey={item.navKey} size={19} />
      {t(item.label)}
    </NavLink>
  )
}

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-ios-dark/80 backdrop-blur-xl border-r border-black/6 dark:border-white/6 min-h-screen pt-4 overflow-y-auto">
      <nav className="flex flex-col gap-0.5 px-3">
        {mainItems.map(item => <NavItem key={item.to} item={item} t={t} />)}

        <p className="ios-section-label px-3 pt-5 pb-1.5">
          {t('nav.tools')}
        </p>
        {toolItems.map(item => <NavItem key={item.to} item={item} t={t} />)}
      </nav>
    </aside>
  )
}

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
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`
      }
    >
      <NavIcon navKey={item.navKey} size={18} strokeWidth={1.75} />
      {t(item.label)}
    </NavLink>
  )
}

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[var(--surface)] border-r border-[var(--border)] min-h-screen pt-3 overflow-y-auto">
      <nav className="flex flex-col gap-0.5 px-2">
        {mainItems.map(item => <NavItem key={item.to} item={item} t={t} />)}

        <p className="ios-section-label px-3 pt-5 pb-2">
          {t('nav.tools')}
        </p>
        {toolItems.map(item => <NavItem key={item.to} item={item} t={t} />)}
      </nav>
    </aside>
  )
}

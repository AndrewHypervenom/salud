import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: '🏠' },
  { to: '/habits', label: 'nav.habits', icon: '✅' },
  { to: '/food', label: 'nav.food', icon: '🍽️' },
  { to: '/calories', label: 'nav.calories', icon: '🔥' },
  { to: '/blood-pressure', label: 'nav.blood_pressure', icon: '❤️' },
  { to: '/diet', label: 'nav.diet', icon: '🥗' },
  { to: '/exercise', label: 'nav.exercise', icon: '🏃' },
  { to: '/doctor-questions', label: 'nav.doctor_questions', icon: '👨‍⚕️' },
  { to: '/profiles', label: 'nav.profiles', icon: '👥' },
]

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen pt-4">
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

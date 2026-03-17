import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

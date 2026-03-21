import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-24 md:pb-8 overflow-x-hidden">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

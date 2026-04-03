import { useState } from 'react'
import { useAdminStats } from '../../hooks/useAdminStats'
import AdminLayout from './components/AdminLayout'
import AdminHeader from './components/AdminHeader'
import StatsSummaryGrid from './components/StatsSummaryGrid'
import FeatureUsageChart from './components/FeatureUsageChart'
import UserGrowthChart from './components/UserGrowthChart'
import ActiveRankingTable from './components/ActiveRankingTable'
import UserDetailModal from './components/UserDetailModal'

export default function AdminDashboard() {
  const { data, loading, error } = useAdminStats()
  const [selectedUser, setSelectedUser] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-indigo-500/20 rounded-full" />
            <div className="w-12 h-12 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-gray-600 text-sm">Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <AdminHeader />
      <StatsSummaryGrid data={data} />
      <UserGrowthChart userGrowthByMonth={data.userGrowthByMonth} totalUsers={data.totalUsers} />
      <FeatureUsageChart totalRecordsByFeature={data.totalRecordsByFeature} />
      <ActiveRankingTable ranking={data.ranking} onSelectUser={setSelectedUser} />

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </AdminLayout>
  )
}

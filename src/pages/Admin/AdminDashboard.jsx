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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">Error al cargar: {error}</p>
      </div>
    )
  }

  return (
    <AdminLayout>
      <AdminHeader lastRefreshed={new Date()} />

      <StatsSummaryGrid data={data} />

      <UserGrowthChart userGrowthByMonth={data.userGrowthByMonth} />

      <FeatureUsageChart totalRecordsByFeature={data.totalRecordsByFeature} />

      <ActiveRankingTable
        ranking={data.ranking}
        onSelectUser={setSelectedUser}
      />

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </AdminLayout>
  )
}

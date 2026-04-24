import { getDashboardStats, getTodayAdminReading } from './actions'
import AdminDashboardView from './AdminDashboardView'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const role = cookieStore.get('user-role')?.value

  if (!role || (role !== 'admin' && role !== 'superuser')) {
    redirect('/login')
  }

  const [statsResult, todayResult] = await Promise.all([
    getDashboardStats(),
    getTodayAdminReading(),
  ])

  const stats = statsResult.success && statsResult.data
    ? statsResult.data
    : { totalUsers: 0, pendingCount: 0, lastUpdated: '' }

  const todayReading = todayResult.success ? todayResult.data : null

  return (
    <AdminDashboardView
      userRole={role}
      stats={stats}
      todayReading={todayReading}
    />
  )
}

import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f0fde4] dark:bg-[#1a2c14] p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        <div className="grid gap-4">
          <div className="p-6 bg-white dark:bg-[#243d1c] rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
            <p>Admin controls here</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { createClient } from '@/utils/supabase/client'

export default function DashboardPage() {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f0fde4] dark:bg-[#1a2c14] p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-all"
          >
            Logout
          </button>
        </div>
        <div className="grid gap-4">
          <div className="p-6 bg-white dark:bg-[#243d1c] rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Welcome</h2>
            <p>Your dashboard content here</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

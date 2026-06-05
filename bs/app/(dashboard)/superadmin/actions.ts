'use server'

import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { sendApprovalEmail, sendRejectionEmail } from '@/utils/sendEmail'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function adminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireSuperadmin() {
  const cookieStore = await cookies()
  if (cookieStore.get('user-role')?.value !== 'superadmin') {
    redirect('/login')
  }
}

export type PendingCoordinator = {
  id: string
  role: string
  grade: number | null
  tenant: string | null
  status: string
  user: { id: string; name: string; email: string; auth_id: string } | null
  gradeName: string | null
  tenantName: string | null
}

export type ActiveCoordinator = {
  id: string
  role: string
  grade: number | null
  tenant: string | null
  user: { name: string; email: string } | null
  gradeName: string | null
  tenantName: string | null
}

export type SuperadminStats = {
  totalCoordinators: number
  pendingCoordinators: number
  totalServants: number
  pendingServants: number
  totalStudents: number
  totalFamilies: number
}

export async function setAdminRole(adminId: string, role: 'admin' | 'superuser'): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()
  const { error } = await supabase.from('admin').update({ role }).eq('id', adminId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getSuperadminData(): Promise<{
  success: boolean
  stats?: SuperadminStats
  pending?: PendingCoordinator[]
  active?: ActiveCoordinator[]
  servants?: ActiveCoordinator[]
  error?: string
}> {
  await requireSuperadmin()
  const supabase = adminClient()

  const [adminRows, enrollmentCount, tenants] = await Promise.all([
    supabase.from('admin').select('id, role, grade, tenant, status, user(id, name, email, auth_id), gradeInfo:grade!admin_grade_fkey(name)'),
    supabase.from('enrollment').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('tenant').select('id, name'),
  ])

  if (adminRows.error) return { success: false, error: adminRows.error.message }

  const tenantMap = Object.fromEntries((tenants.data ?? []).map(t => [t.id, t.name]))

  const rows = (adminRows.data ?? []) as unknown as Array<{
    id: string; role: string; grade: number | null; tenant: string | null; status: string
    user: { id: string; name: string; email: string; auth_id: string } | null
    gradeInfo: { name: string } | null
  }>

  const stats: SuperadminStats = {
    totalCoordinators: rows.filter(r => r.role === 'admin').length,
    pendingCoordinators: rows.filter(r => r.role === 'admin' && r.status === 'pending').length,
    totalServants: rows.filter(r => r.role === 'superuser').length,
    pendingServants: rows.filter(r => r.role === 'superuser' && r.status === 'pending').length,
    totalStudents: enrollmentCount.count ?? 0,
    totalFamilies: tenants.data?.length ?? 0,
  }

  const pending: PendingCoordinator[] = rows
    .filter(r => r.role === 'admin' && r.status === 'pending')
    .map(r => ({
      id: r.id, role: r.role, grade: r.grade, tenant: r.tenant, status: r.status,
      user: r.user,
      gradeName: r.gradeInfo?.name ?? null,
      tenantName: r.tenant ? (tenantMap[r.tenant] ?? r.tenant) : null,
    }))

  const active: ActiveCoordinator[] = rows
    .filter(r => r.role === 'admin' && r.status === 'accepted')
    .map(r => ({
      id: r.id, role: r.role, grade: r.grade, tenant: r.tenant,
      user: r.user,
      gradeName: r.gradeInfo?.name ?? null,
      tenantName: r.tenant ? (tenantMap[r.tenant] ?? r.tenant) : null,
    }))

  const servants: ActiveCoordinator[] = rows
    .filter(r => r.role === 'superuser' && r.status === 'accepted')
    .map(r => ({
      id: r.id, role: r.role, grade: r.grade, tenant: r.tenant,
      user: r.user,
      gradeName: r.gradeInfo?.name ?? null,
      tenantName: r.tenant ? (tenantMap[r.tenant] ?? r.tenant) : null,
    }))

  return { success: true, stats, pending, active, servants }
}

export async function approveCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  const { data: adminRow } = await supabase
    .from('admin')
    .select('user_id')
    .eq('id', adminId)
    .single()

  const { error } = await supabase.from('admin').update({ status: 'accepted' }).eq('id', adminId)
  if (error) return { success: false, error: error.message }

  if (adminRow?.user_id) {
    const { data: user } = await supabase
      .from('user')
      .select('email, name')
      .eq('id', adminRow.user_id)
      .single()
    if (user?.email && user?.name) {
      try { await sendApprovalEmail(user.email, user.name) } catch (e) { console.error('Approval email failed:', e) }
    }
  }

  return { success: true }
}

export async function rejectCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  const { data: adminRow } = await supabase
    .from('admin')
    .select('user_id')
    .eq('id', adminId)
    .single()

  if (!adminRow?.user_id) return { success: false, error: 'Admin record not found' }

  const { data: user } = await supabase
    .from('user')
    .select('id, email, name, auth_id')
    .eq('id', adminRow.user_id)
    .single()

  if (user?.email && user?.name) {
    try { await sendRejectionEmail(user.email, user.name) } catch (e) { console.error('Rejection email failed:', e) }
  }

  await supabase.from('admin').delete().eq('id', adminId)

  if (user?.id) {
    const { error } = await supabase.from('user').delete().eq('id', user.id)
    if (error) console.error('User delete failed:', error.message)
  }

  if (user?.auth_id) {
    const { error } = await supabase.auth.admin.deleteUser(user.auth_id)
    if (error) console.error('Auth delete failed:', error.message)
  }

  return { success: true }
}

export async function signOutSuperadmin() {
  const cookieStore = await cookies()
  cookieStore.set('user-role', '', { path: '/', maxAge: 0 })
  redirect('/login')
}

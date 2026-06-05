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

function anonClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function requireSuperadmin() {
  const cookieStore = await cookies()
  if (cookieStore.get('user-role')?.value !== 'superadmin') redirect('/login')
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PendingCoordinator = {
  id: string
  grade: number | null
  tenant: string | null
  status: string
  user: { id: string; name: string; email: string; auth_id: string } | null
  gradeName: string | null
  tenantName: string | null
}

export type Member = {
  id: string
  role: string
  grade: number | null
  tenant: string | null
  user: { name: string; email: string } | null
  gradeName: string | null
  tenantName: string | null
}

export type GradeOption = {
  grade_num: number
  name: string
  tenant: string
  tenantName: string
}

export type SuperadminStats = {
  totalCoordinators: number
  pendingCoordinators: number
  totalServants: number
  totalStudents: number
  totalFamilies: number
}

export type TenantInfo = {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchTenantMap() {
  const { data, error } = await anonClient().from('tenant').select('id, name')
  if (error) console.error('[superadmin] fetchTenantMap error:', error.message)
  return Object.fromEntries((data ?? []).map(t => [t.id, t.name as string]))
}

async function fetchAdminRows() {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('admin')
    .select('id, role, grade, tenant, status, user(id, name, email, auth_id), gradeInfo:grade!admin_grade_fkey(name)')
  return { data, error }
}

function mapMember(r: {
  id: string; role: string; grade: number | null; tenant: string | null
  user: { id: string; name: string; email: string; auth_id: string } | null
  gradeInfo: { name: string } | null
}, tenantMap: Record<string, string>): Member {
  return {
    id: r.id, role: r.role, grade: r.grade, tenant: r.tenant,
    user: r.user,
    gradeName: r.gradeInfo?.name ?? null,
    tenantName: r.tenant ? (tenantMap[r.tenant] ?? r.tenant) : null,
  }
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getSuperadminData(): Promise<{
  success: boolean
  stats?: SuperadminStats
  pending?: PendingCoordinator[]
  tenants?: TenantInfo[]
  error?: string
}> {
  await requireSuperadmin()
  const supabase = adminClient()

  const [{ data, error }, enrollmentCount, tenantsRes] = await Promise.all([
    fetchAdminRows(),
    supabase.from('enrollment').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    anonClient().from('tenant').select('id, name').order('name'),
  ])

  if (error) return { success: false, error: error.message }
  if (tenantsRes.error) console.error('[superadmin] tenant query error:', tenantsRes.error.message)

  const tenantList: TenantInfo[] = (tenantsRes.data ?? []).map(t => ({ id: t.id, name: t.name as string }))
  const tenantMap = Object.fromEntries(tenantList.map(t => [t.id, t.name]))

  const rows = (data ?? []) as unknown as Array<{
    id: string; role: string; grade: number | null; tenant: string | null; status: string
    user: { id: string; name: string; email: string; auth_id: string } | null
    gradeInfo: { name: string } | null
  }>

  const stats: SuperadminStats = {
    totalCoordinators: rows.filter(r => r.role === 'admin' && r.status === 'accepted').length,
    pendingCoordinators: rows.filter(r => r.role === 'admin' && r.status === 'pending').length,
    totalServants: rows.filter(r => r.role === 'superuser' && r.status === 'accepted').length,
    totalStudents: enrollmentCount.count ?? 0,
    totalFamilies: tenantList.length,
  }

  const pending: PendingCoordinator[] = rows
    .filter(r => r.role === 'admin' && r.status === 'pending')
    .map(r => ({
      id: r.id, grade: r.grade, tenant: r.tenant, status: r.status,
      user: r.user,
      gradeName: r.gradeInfo?.name ?? null,
      tenantName: r.tenant ? (tenantMap[r.tenant] ?? null) : null,
    }))

  return { success: true, stats, pending, tenants: tenantList }
}

// ─── Coordinators page ────────────────────────────────────────────────────────

export async function getCoordinators(): Promise<{ success: boolean; data?: Member[]; error?: string }> {
  await requireSuperadmin()
  const [{ data, error }, tenantMap] = await Promise.all([fetchAdminRows(), fetchTenantMap()])
  if (error) return { success: false, error: error.message }
  const rows = (data ?? []) as unknown as Array<{
    id: string; role: string; grade: number | null; tenant: string | null; status: string
    user: { id: string; name: string; email: string; auth_id: string } | null
    gradeInfo: { name: string } | null
  }>
  return {
    success: true,
    data: rows.filter(r => r.role === 'admin' && r.status === 'accepted').map(r => mapMember(r, tenantMap)),
  }
}

// ─── Servants page ────────────────────────────────────────────────────────────

export async function getServants(): Promise<{ success: boolean; data?: Member[]; grades?: GradeOption[]; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()
  const [{ data, error }, gradesRes, tenants] = await Promise.all([
    fetchAdminRows(),
    anonClient().from('grade').select('grade_num, name, tenant').order('grade_num'),
    anonClient().from('tenant').select('id, name'),
  ])
  if (error) return { success: false, error: error.message }
  const tenantMap = Object.fromEntries((tenants.data ?? []).map(t => [t.id, t.name as string]))
  const rows = (data ?? []) as unknown as Array<{
    id: string; role: string; grade: number | null; tenant: string | null; status: string
    user: { id: string; name: string; email: string; auth_id: string } | null
    gradeInfo: { name: string } | null
  }>
  const grades: GradeOption[] = (gradesRes.data ?? []).map(g => ({
    grade_num: g.grade_num,
    name: g.name,
    tenant: g.tenant,
    tenantName: tenantMap[g.tenant] ?? g.tenant,
  }))
  return {
    success: true,
    data: rows.filter(r => r.role === 'superuser' && r.status === 'accepted').map(r => mapMember(r, tenantMap)),
    grades,
  }
}

// ─── Role management ──────────────────────────────────────────────────────────

export async function promoteToCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  // Get current servant's grade + tenant
  const { data: target } = await supabase.from('admin').select('grade, tenant').eq('id', adminId).single()
  if (!target) return { success: false, error: 'Servant not found' }

  // Block if grade already has an accepted coordinator
  const { data: existing } = await supabase
    .from('admin')
    .select('id')
    .eq('role', 'admin')
    .eq('status', 'accepted')
    .eq('grade', target.grade)
    .eq('tenant', target.tenant)
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: 'This grade already has a coordinator' }
  }

  const { error } = await supabase.from('admin').update({ role: 'admin' }).eq('id', adminId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function demoteToServant(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()
  const { error } = await supabase.from('admin').update({ role: 'superuser' }).eq('id', adminId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function transferServant(adminId: string, gradeNum: number, tenant: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()
  const { error } = await supabase.from('admin').update({ grade: gradeNum, tenant }).eq('id', adminId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Approve / Reject ─────────────────────────────────────────────────────────

export async function approveCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  const { data: adminRow } = await supabase.from('admin').select('user_id').eq('id', adminId).single()
  const { error } = await supabase.from('admin').update({ status: 'accepted' }).eq('id', adminId)
  if (error) return { success: false, error: error.message }

  if (adminRow?.user_id) {
    const { data: user } = await supabase.from('user').select('email, name').eq('id', adminRow.user_id).single()
    if (user?.email && user?.name) {
      try { await sendApprovalEmail(user.email, user.name) } catch (e) { console.error('Approval email failed:', e) }
    }
  }
  return { success: true }
}

export async function rejectCoordinator(adminId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperadmin()
  const supabase = adminClient()

  const { data: adminRow } = await supabase.from('admin').select('user_id').eq('id', adminId).single()
  if (!adminRow?.user_id) return { success: false, error: 'Admin record not found' }

  const { data: user } = await supabase.from('user').select('id, email, name, auth_id').eq('id', adminRow.user_id).single()
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

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOutSuperadmin() {
  const cookieStore = await cookies()
  cookieStore.set('user-role', '', { path: '/', maxAge: 0 })
  redirect('/login')
}

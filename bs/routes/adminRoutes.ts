import { getPendingUsers, approveUser, getAllUsersByRole, createAdmin } from '@/api/adminApi'

export async function handleGetPendingUsers() {
  const { data, error } = await getPendingUsers()
  if (error) throw new Error(error.message)
  return data
}

export async function handleApproveUser(userId: string, approved: boolean) {
  const { data, error } = await approveUser(userId, approved)
  if (error) throw new Error(error.message)
  return data
}

export async function handleGetUsersByRole(role: string) {
  const { data, error } = await getAllUsersByRole(role)
  if (error) throw new Error(error.message)
  return data
}

export async function handleAdminRegistration(adminData: {
  user_id: string
  grade: number
  role: 'admin' | 'superuser'
  tenant: string
}) {
  const { data, error } = await createAdmin({ ...adminData, status: 'pending' })
  if (error) throw new Error(error.message)
  return data
}

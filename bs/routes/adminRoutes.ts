import { getPendingUsers, approveUser, getAllUsersByRole } from '@/api/adminApi'

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

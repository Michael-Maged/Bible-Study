import { createUser, getUsers, getUserById, updateUser, deleteUser } from '@/api/userApi'

export async function handleUserRegistration(userData: any) {
  const { data, error } = await createUser({
    name: userData.name,
    phone: userData.phone,
    age: userData.age,
    gender: userData.gender,
    familyRole: userData.familyRole,
    tenantId: userData.tenantId,
    gradeId: userData.gradeId,
    classId: userData.classId
  })

  if (error) throw new Error(error.message)
  return data
}

export async function handleGetUsers() {
  const { data, error } = await getUsers()
  if (error) throw new Error(error.message)
  return data
}

export async function handleGetUserById(id: string) {
  const { data, error } = await getUserById(id)
  if (error) throw new Error(error.message)
  return data
}

export async function handleUpdateUser(id: string, updates: any) {
  const { data, error } = await updateUser(id, updates)
  if (error) throw new Error(error.message)
  return data
}

export async function handleDeleteUser(id: string) {
  const { error } = await deleteUser(id)
  if (error) throw new Error(error.message)
}

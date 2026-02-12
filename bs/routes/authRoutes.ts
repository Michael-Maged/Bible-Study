import { loginUser } from '@/api/authClientApi'

export async function handleLogin(phone: string, name: string) {
  const { data, error } = await loginUser(phone, name)

  if (error || !data) {
    throw new Error('Invalid credentials')
  }

  if (!data.approved) {
    throw new Error('Account pending approval')
  }

  return data
}

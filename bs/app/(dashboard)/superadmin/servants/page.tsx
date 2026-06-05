import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServants } from '../actions'
import ServantsView from './ServantsView'

export default async function ServantsPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('user-role')?.value !== 'superadmin') redirect('/login')

  const result = await getServants()
  if (!result.success) {
    console.error('[superadmin/servants] failed:', result.error)
    redirect('/superadmin')
  }

  return <ServantsView servants={result.data!} grades={result.grades!} />
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSuperadminData } from './actions'
import SuperadminView from './SuperadminView'

export default async function SuperadminPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get('user-role')?.value
  if (role !== 'superadmin') redirect('/login')

  const result = await getSuperadminData()
  if (!result.success) {
    console.error('[superadmin] getSuperadminData failed:', result.error)
    redirect('/login')
  }

  return (
    <SuperadminView
      stats={result.stats!}
      pending={result.pending!}
      active={result.active!}
      servants={result.servants!}
    />
  )
}

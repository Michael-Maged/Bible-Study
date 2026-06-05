import { redirect } from 'next/navigation'
import { getSuperadminData } from './actions'
import SuperadminView from './SuperadminView'

export default async function SuperadminPage() {
  const result = await getSuperadminData()
  if (!result.success) {
    console.error('[superadmin] getSuperadminData failed:', result.error)
    redirect('/login')
  }

  return <SuperadminView stats={result.stats!} pending={result.pending!} tenants={result.tenants!} />
}

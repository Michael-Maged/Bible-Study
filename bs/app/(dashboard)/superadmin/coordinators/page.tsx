import { redirect } from 'next/navigation'
import { getCoordinators } from '../actions'
import CoordinatorsView from './CoordinatorsView'

export default async function CoordinatorsPage() {
  const result = await getCoordinators()
  if (!result.success) {
    console.error('[superadmin/coordinators] failed:', result.error)
    redirect('/superadmin')
  }

  return <CoordinatorsView coordinators={result.data!} />
}

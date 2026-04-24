import { getTodayReading } from './actions'
import KidDashboardView from './KidDashboardView'
import LoadingScreen from '@/components/LoadingScreen'
import { Suspense } from 'react'
import type { Question } from '@/types'

async function DashboardContent() {
  const result = await getTodayReading()

  let data = result.success ? result.data ?? null : null

  if (data?.questions?.length) {
    const questionsWithCounts = await Promise.all(
      data.questions.map(async (q: Question) => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/questions/correct-count?questionId=${q.id}`,
            { cache: 'no-store' }
          )
          const json = await res.json()
          return { ...q, correctCount: json.count || 1 }
        } catch {
          return { ...q, correctCount: 1 }
        }
      })
    )
    data = { ...data, questions: questionsWithCounts }
  }

  return <KidDashboardView initialReading={data} />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  )
}

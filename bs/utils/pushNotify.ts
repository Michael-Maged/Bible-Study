'use server'

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const getAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

async function sendToSubs(subs: { subscription: string }[], payload: object) {
  const str = JSON.stringify(payload)
  await Promise.allSettled(
    subs.map(({ subscription }) => webpush.sendNotification(JSON.parse(subscription), str))
  )
}

export async function sendNewRegistrationNotification({
  kidName,
  ageGroup,
  grade,
  tenant,
  gender,
}: {
  kidName: string
  ageGroup: string
  grade: number
  tenant: string
  gender: string
}) {
  const supabase = getAdminClient()

  const { data: gradeData } = await supabase
    .from('grade')
    .select('gender')
    .eq('grade_num', grade)
    .eq('tenant', tenant)
    .single()

  const isMixed = gradeData?.gender === 'mix' || gradeData?.gender === 'mixed'

  let query = supabase
    .from('pushsubscriptions')
    .select('subscription')
    .eq('grade', grade)
    .eq('tenant', tenant)

  if (!isMixed) query = query.eq('gender', gender)

  const { data: subs } = await query
  if (!subs?.length) return

  await sendToSubs(subs, {
    title: '📋 New Registration',
    body: `${kidName} (${ageGroup}) is awaiting approval`,
    url: '/admin/pending',
  })
}

export async function sendDailyReadingReminder() {
  const supabase = getAdminClient()
  const today = new Date().toLocaleDateString('en-CA')
  console.log('[daily] today:', today)

  const { data: readings, error: readingsError } = await supabase
    .from('reading')
    .select('id, book, chapter, from_verse, to_verse, grade, tenant')
    .eq('day', today)
  console.log('[daily] readings:', readings?.length, 'error:', readingsError?.message)
  if (!readings?.length) return

  const { data: subs, error: subsError } = await supabase
    .from('pushsubscriptions')
    .select('user_id, subscription, grade, tenant')
    .eq('role', 'kid')
  console.log('[daily] subs:', subs?.length, 'error:', subsError?.message)
  if (!subs?.length) return

  const readingIds = readings.map(r => r.id)
  const { data: completions } = await supabase
    .from('readinghistory')
    .select('user_id, reading')
    .in('reading', readingIds)

  const completedUserIds = new Set((completions || []).map(c => c.user_id))
  console.log('[daily] completed users:', completedUserIds.size)

  const results = await Promise.allSettled(
    subs
      .filter(sub => !completedUserIds.has(sub.user_id))
      .map(sub => {
        const reading = readings.find(r => r.grade === sub.grade && r.tenant === sub.tenant)
          ?? readings.find(r => r.grade === null && r.tenant === sub.tenant)
        console.log('[daily] sub:', sub.user_id, 'grade:', sub.grade, 'tenant:', sub.tenant, 'reading found:', !!reading)
        if (!reading) return Promise.resolve()

        const bookLabel = `Chapter ${reading.chapter}:${reading.from_verse}–${reading.to_verse}`
        const payload = JSON.stringify({
          title: '📖 Time for your Bible reading!',
          body: `Today: ${bookLabel}`,
          url: '/kid/dashboard',
        })
        return webpush.sendNotification(JSON.parse(sub.subscription), payload)
      })
  )
  console.log('[daily] results:', results.map(r => r.status === 'rejected' ? r.reason?.message : 'ok'))
}

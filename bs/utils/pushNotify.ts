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

  const payload = JSON.stringify({
    title: '📋 New Registration',
    body: `${kidName} (${ageGroup}) is awaiting approval`,
    url: '/admin/pending',
  })

  await Promise.allSettled(
    subs.map(({ subscription }) =>
      webpush.sendNotification(JSON.parse(subscription), payload)
    )
  )
}

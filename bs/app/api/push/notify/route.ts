import { NextRequest, NextResponse } from 'next/server'
import { sendNewRegistrationNotification } from '@/utils/pushNotify'

export async function POST(req: NextRequest) {
  const { kidName, ageGroup, grade, tenant, gender } = await req.json()
  await sendNewRegistrationNotification({ kidName, ageGroup, grade, tenant, gender })
  return NextResponse.json({ ok: true })
}

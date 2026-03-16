import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReadingReminder } from '@/utils/pushNotify'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await sendDailyReadingReminder()
  return NextResponse.json({ ok: true })
}

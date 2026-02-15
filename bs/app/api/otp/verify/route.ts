import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json()
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json({ success: true, session: data.session })
}

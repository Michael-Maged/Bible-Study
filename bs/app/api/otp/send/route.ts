import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    
    // Ensure phone is in E.164 format (+1234567890)
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }
    
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithOtp({ 
      phone: formattedPhone,
      options: {
        channel: 'sms'
      }
    })
    
    if (error) {
      console.error('Supabase OTP error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('OTP send error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { handleUserRegistration } from '@/routes/userRoutes'

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json()
    const user = await handleUserRegistration(userData)
    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

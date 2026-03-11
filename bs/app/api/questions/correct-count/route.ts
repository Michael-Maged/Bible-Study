import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'Question ID required' }, { status: 400 })
    }

    const { data, error } = await serviceSupabase
      .from('correctanswers')
      .select('*')
      .eq('question', questionId)

    if (error) {
      console.error('Error fetching correct answers:', error)
      throw error
    }

    console.log(`Question ${questionId}: Found ${data?.length || 0} correct answers`)
    return NextResponse.json({ success: true, count: data?.length || 0 })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

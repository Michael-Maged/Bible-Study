import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reading, question, score, options } = body

    const { data: questionData, error: questionError } = await serviceSupabase
      .from('question')
      .insert({ reading, question, score })
      .select()
      .single()

    if (questionError) throw questionError

    const optionsToInsert = options.map((opt: any) => ({
      question: questionData.id,
      option: opt.text
    }))

    const { data: optionsData, error: optionsError } = await serviceSupabase
      .from('options')
      .insert(optionsToInsert)
      .select()

    if (optionsError) throw optionsError

    const correctAnswers = options
      .map((opt: any, idx: number) => opt.isCorrect ? idx : -1)
      .filter((idx: number) => idx !== -1)
      .map((idx: number) => ({
        question: questionData.id,
        correct_option: optionsData[idx].id
      }))

    if (correctAnswers.length > 0) {
      const { error: correctError } = await serviceSupabase
        .from('correctanswers')
        .insert(correctAnswers)
      
      if (correctError) throw correctError
    }

    return NextResponse.json({ success: true, data: questionData })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const readingId = searchParams.get('reading')

    if (!readingId) {
      return NextResponse.json({ success: false, error: 'Reading ID required' }, { status: 400 })
    }

    const { data: questions, error } = await serviceSupabase
      .from('question')
      .select('*, options(*)')
      .eq('reading', readingId)

    if (error) throw error

    return NextResponse.json({ success: true, data: questions })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

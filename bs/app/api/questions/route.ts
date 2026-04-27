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

    const { data: questions, error: qError } = await serviceSupabase
      .from('question')
      .select('id, question, score')
      .eq('reading', readingId)

    if (qError) {
      console.error('question fetch error:', qError)
      return NextResponse.json({ success: false, error: qError.message }, { status: 500 })
    }

    const questionsWithData = await Promise.all(
      (questions || []).map(async (q) => {
        const { data: options, error: oError } = await serviceSupabase
          .from('options')
          .select('id, option')
          .eq('question', q.id)

        if (oError) console.error('options fetch error:', oError)

        const { data: correctanswers, error: cError } = await serviceSupabase
          .from('correctanswers')
          .select('correct_option')
          .eq('question', q.id)

        if (cError) console.error('correctanswers fetch error:', cError)

        return { ...q, options: options || [], correctanswers: correctanswers || [] }
      })
    )

    return NextResponse.json({ success: true, data: questionsWithData })
  } catch (error: any) {
    console.error('GET /api/questions error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { questionId } = await request.json()
    if (!questionId) return NextResponse.json({ success: false, error: 'Question ID required' }, { status: 400 })
    const { error } = await serviceSupabase.from('question').delete().eq('id', questionId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { questionId, question, score, options } = await request.json()
    if (!questionId) return NextResponse.json({ success: false, error: 'Question ID required' }, { status: 400 })

    // Update question text and score
    const { error: qError } = await serviceSupabase
      .from('question')
      .update({ question, score })
      .eq('id', questionId)
    if (qError) throw qError

    // Delete old options and correct answers, then re-insert
    await serviceSupabase.from('correctanswers').delete().eq('question', questionId)
    await serviceSupabase.from('options').delete().eq('question', questionId)

    const optionsToInsert = options.map((opt: { text: string }) => ({ question: questionId, option: opt.text }))
    const { data: optionsData, error: oError } = await serviceSupabase.from('options').insert(optionsToInsert).select()
    if (oError) throw oError

    const correctAnswers = options
      .map((opt: { text: string; isCorrect: boolean }, idx: number) => opt.isCorrect ? idx : -1)
      .filter((idx: number) => idx !== -1)
      .map((idx: number) => ({ question: questionId, correct_option: optionsData[idx].id }))

    if (correctAnswers.length > 0) {
      const { error: cError } = await serviceSupabase.from('correctanswers').insert(correctAnswers)
      if (cError) throw cError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

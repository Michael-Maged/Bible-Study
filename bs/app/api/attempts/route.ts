import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, readingId, answers } = body

    const attemptsToInsert = answers.map((answer: any) => ({
      user_id: userId,
      question: answer.questionId,
      option: answer.optionId
    }))

    const { error: attemptsError } = await serviceSupabase
      .from('attempts')
      .insert(attemptsToInsert)

    if (attemptsError) throw attemptsError

    const { data: questions } = await serviceSupabase
      .from('question')
      .select('id, score')
      .eq('reading', readingId)

    // Get all correct answers for scoring
    const { data: correctAnswers } = await serviceSupabase
      .from('correctanswers')
      .select('question, correct_option')
      .in('question', questions?.map(q => q.id) || [])

    // Group answers by question
    const answersByQuestion: Record<string, string[]> = {}
    answers.forEach((answer: any) => {
      if (!answersByQuestion[answer.questionId]) {
        answersByQuestion[answer.questionId] = []
      }
      answersByQuestion[answer.questionId].push(answer.optionId)
    })

    // Group correct answers by question
    const correctByQuestion: Record<string, string[]> = {}
    correctAnswers?.forEach((ca: any) => {
      if (!correctByQuestion[ca.question]) {
        correctByQuestion[ca.question] = []
      }
      correctByQuestion[ca.question].push(ca.correct_option)
    })

    let totalScore = 0
    const results = answers.map((answer: any) => {
      const isCorrect = correctAnswers?.some(
        ca => ca.question === answer.questionId && ca.correct_option === answer.optionId
      )
      return { questionId: answer.questionId, optionId: answer.optionId, isCorrect }
    })

    // Award points only if ALL answers for a question are correct
    Object.keys(answersByQuestion).forEach(questionId => {
      const studentAnswers = answersByQuestion[questionId].sort()
      const correctAnswersForQ = (correctByQuestion[questionId] || []).sort()
      
      // Check if arrays are equal (same length and same elements)
      const isFullyCorrect = studentAnswers.length === correctAnswersForQ.length &&
        studentAnswers.every((ans, idx) => ans === correctAnswersForQ[idx])
      
      if (isFullyCorrect) {
        const question = questions?.find(q => q.id === questionId)
        totalScore += question?.score || 0
      }
    })

    const { data: user } = await serviceSupabase
      .from('user')
      .select('current_score')
      .eq('id', userId)
      .single()

    await serviceSupabase
      .from('user')
      .update({ current_score: (user?.current_score || 0) + totalScore })
      .eq('id', userId)

    return NextResponse.json({ success: true, results, totalScore, correctAnswers })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

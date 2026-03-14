'use server'
import type { QuestionBuilder, QuestionOptionBuilder } from '@/types'

export async function saveReadingAction(data: {
  book: number
  chapter: number
  from_verse: number
  to_verse: number
  day: string
  grade: number | null
  tenant: string
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/bible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()
    return result
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function saveQuestionsAction(readingId: string, questions: QuestionBuilder[]) {
  try {
    for (const q of questions) {
      if (!q.question.trim() || q.options.length < 2) {
        return { success: false, error: 'Each question must have text and at least 2 options' }
      }
      
      const hasCorrect = q.options.some((opt: QuestionOptionBuilder) => opt.isCorrect)
      if (!hasCorrect) {
        return { success: false, error: 'Each question must have a correct answer marked' }
      }
      
      const hasEmptyOption = q.options.some((opt: QuestionOptionBuilder) => !opt.text.trim())
      if (hasEmptyOption) {
        return { success: false, error: 'All options must have text' }
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading: readingId,
          question: q.question,
          score: q.score,
          options: q.options
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        return { success: false, error: result.error }
      }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

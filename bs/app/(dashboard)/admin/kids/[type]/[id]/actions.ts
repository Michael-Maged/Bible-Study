'use server'

import { createClient } from '@/utils/supabase/server'

export async function getKidFullProfile(userId: string) {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('user')
    .select('id, name, email, age, gender, current_score, streak, best_streak')
    .eq('id', userId)
    .single()

  if (!user) return { success: false as const, error: 'User not found' }
  return { success: true as const, data: user }
}

export async function getKidDetailedStats(userId: string) {
  const supabase = await createClient()

  // All-time reading history with reading metadata
  const { data: history } = await supabase
    .from('readinghistory')
    .select('reading!inner(id, day, book, chapter, from_verse, to_verse), inserted_at')
    .eq('user_id', userId)
    .order('inserted_at', { ascending: false })

  type HistRow = {
    reading: { id: string; day: string; book: string; chapter: number; from_verse: number; to_verse: number } | null
    inserted_at: string
  }

  const rows = (history as HistRow[] | null) ?? []
  const readingIds = rows.map(r => r.reading?.id).filter(Boolean) as string[]

  // Questions for those readings
  const { data: questions } = readingIds.length
    ? await supabase.from('question').select('id, reading, score').in('reading', readingIds)
    : { data: [] }

  // Correct answers
  const questionIds = (questions ?? []).map(q => q.id)
  const { data: correctAnswers } = questionIds.length
    ? await supabase.from('correctanswers').select('question, correct_option').in('question', questionIds)
    : { data: [] }

  // Kid's attempts
  const { data: attempts } = questionIds.length
    ? await supabase.from('attempts').select('question, option').eq('user_id', userId).in('question', questionIds)
    : { data: [] }

  const correctSet = new Set((correctAnswers ?? []).map(ca => `${ca.question}:${ca.correct_option}`))

  // Build per-reading stats
  const readingHistory = rows.map(row => {
    const r = row.reading!
    const rQuestions = (questions ?? []).filter(q => q.reading === r.id)
    const rAttempts = (attempts ?? []).filter(a => rQuestions.some(q => q.id === a.question))
    const correctCount = rAttempts.filter(a => correctSet.has(`${a.question}:${a.option}`)).length
    const quizPct = rAttempts.length > 0 ? Math.round((correctCount / rAttempts.length) * 100) : null
    const earnedScore = rQuestions
      .filter(q => {
        const qAttempts = rAttempts.filter(a => a.question === q.id)
        return qAttempts.length > 0 && qAttempts.every(a => correctSet.has(`${a.question}:${a.option}`))
      })
      .reduce((sum, q) => sum + (q.score ?? 0), 0)

    return {
      readingId: r.id,
      day: r.day,
      book: r.book,
      chapter: r.chapter,
      fromVerse: r.from_verse,
      toVerse: r.to_verse,
      completedAt: row.inserted_at,
      hasQuiz: rQuestions.length > 0,
      quizPct,
      earnedScore,
      totalAttempts: rAttempts.length,
      correctAttempts: correctCount,
    }
  })

  // Monthly breakdown (current month)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = now.toISOString().slice(0, 10)

  const completedThisMonth = readingHistory.filter(r => r.day.startsWith(monthStr))
  const allDaysThisMonth = Array.from({ length: daysInMonth }, (_, i) =>
    `${monthStr}-${String(i + 1).padStart(2, '0')}`
  )
  const missedDays = allDaysThisMonth.filter(
    d => d <= today && !completedThisMonth.some(r => r.day === d)
  )

  // Overall quiz accuracy (all time)
  const totalAttempts = (attempts ?? []).length
  const totalCorrect = (attempts ?? []).filter(a => correctSet.has(`${a.question}:${a.option}`)).length
  const overallQuizPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null

  return {
    success: true as const,
    data: {
      readingHistory,
      totalDaysRead: readingHistory.length,
      totalDaysThisMonth: completedThisMonth.length,
      missedDaysThisMonth: missedDays.length,
      overallQuizPct,
      totalAttempts,
      totalCorrect,
    },
  }
}

export async function adjustKidPoints(userId: string, delta: number) {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('user')
    .select('current_score')
    .eq('id', userId)
    .single()

  if (!user) return { success: false as const, error: 'User not found' }

  const newScore = Math.max(0, (user.current_score || 0) + delta)

  const { error } = await supabase
    .from('user')
    .update({ current_score: newScore })
    .eq('id', userId)

  if (error) return { success: false as const, error: error.message }
  return { success: true as const, data: { newScore } }
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { getLocalDateString } from '@/utils/dateUtils'

export async function getUserProfile() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('user')
      .select('*, enrollment(*, class:classes(*))')
      .eq('auth_id', authUser.id)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { 
      success: true, 
      data: {
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        current_score: user.current_score || 0,
        best_streak: user.best_streak || 0,
        streak: user.streak || 0,
        points: user.current_score || 0,
        level: 5,
        progress: 80,
        grade: user.enrollment?.[0]?.class?.grade,
        tenant: user.enrollment?.[0]?.class?.tenant,
        className: user.enrollment?.[0]?.class?.name
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTodayReading() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('user')
      .select('id, *, enrollment(*, class:classes(*, grade:grade(*)))')
      .eq('auth_id', authUser.id)
      .single()

    if (!user || !user.enrollment?.[0]?.class?.grade) {
      return { success: false, error: 'User enrollment not found' }
    }

    const gradeNum = user.enrollment[0].class.grade.grade_num
    const tenant = user.enrollment[0].class.grade.tenant
    const today = getLocalDateString()

    const { data: readings } = await supabase
      .from('reading')
      .select('*')
      .eq('tenant', tenant)
      .eq('day', today)

    let reading = readings?.find(r => r.grade === gradeNum)
    
    if (!reading) {
      reading = readings?.find(r => r.grade === null)
    }

    if (!reading) {
      return { success: false, error: 'No reading assigned' }
    }

    const { data: completion } = await supabase
      .from('readinghistory')
      .select('*')
      .eq('user_id', user.id)
      .eq('reading', reading.id)
      .single()

    const { data: questions } = await supabase
      .from('question')
      .select('*, options!options_question_fkey(*)')
      .eq('reading', reading.id)

    const { data: attempts } = await supabase
      .from('attempts')
      .select('question, option')
      .eq('user_id', user.id)
      .in('question', questions?.map(q => q.id) || [])

    // Get correct answers if user has attempted
    let correctAnswers = null
    if (attempts && attempts.length > 0) {
      const { data: correctAnswersData } = await supabase
        .from('correctanswers')
        .select('question, correct_option')
        .in('question', questions?.map(q => q.id) || [])
      correctAnswers = correctAnswersData
    }

    const response = await fetch(
      `https://arabic-bible.onrender.com/api?book=${reading.book}&ch=${reading.chapter}&ver=${reading.from_verse}:${reading.to_verse}`
    )
    const bibleData = await response.json()

    return {
      success: true,
      data: {
        userId: user.id,
        readingId: reading.id,
        book: reading.book,
        chapter: reading.chapter,
        fromVerse: reading.from_verse,
        toVerse: reading.to_verse,
        text: bibleData.arr || [bibleData.text],
        bookName: bibleData.book_name || 'Genesis',
        reference: `${bibleData.book_name || 'Genesis'} ${reading.chapter}:${reading.from_verse}-${reading.to_verse}`,
        isCompleted: !!completion,
        readingDate: reading.day,
        questions: questions || [],
        hasAttempted: attempts && attempts.length > 0,
        attempts: attempts || [],
        correctAnswers: correctAnswers || []
      }
    }
  } catch (error: any) {
    console.error('getTodayReading error:', error)
    return { success: false, error: error.message }
  }
}

export async function markReadingComplete(readingId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase
      .from('user')
      .select('id, streak, best_streak')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { data: reading } = await supabase
      .from('reading')
      .select('day')
      .eq('id', readingId)
      .single()

    if (!reading) {
      return { success: false, error: 'Reading not found' }
    }

    const today = getLocalDateString()
    if (reading.day > today) {
      return { success: false, error: 'Cannot complete future readings' }
    }

    const { data: existingCompletion } = await supabase
      .from('readinghistory')
      .select('*')
      .eq('user_id', user.id)
      .eq('reading', readingId)
      .single()

    if (existingCompletion) {
      return { success: false, error: 'Reading already completed' }
    }

    const { data: lastCompletion } = await supabase
      .from('readinghistory')
      .select('reading')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let newStreak = 1
    if (lastCompletion?.reading?.day) {
      const lastDate = new Date(lastCompletion.reading.day)
      const currentDate = new Date(reading.day)
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        newStreak = (user.streak || 0) + 1
      } else if (diffDays > 1) {
        newStreak = 1
      }
    }

    const newBestStreak = Math.max(user.best_streak || 0, newStreak)

    const { error: insertError } = await supabase
      .from('readinghistory')
      .insert({
        user_id: user.id,
        reading: readingId
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: false, error: 'Reading already completed' }
      }
      throw insertError
    }

    const { error: updateError } = await supabase
      .from('user')
      .update({ 
        streak: newStreak,
        best_streak: newBestStreak
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    console.error('markReadingComplete error:', error)
    return { success: false, error: error.message }
  }
}

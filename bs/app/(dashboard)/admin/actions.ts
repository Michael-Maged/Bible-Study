'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import type { AdminStats } from '@/types'

export async function getDashboardStats(cacheData?: AdminStats) {
  if (cacheData) {
    return { success: true, data: cacheData, fromCache: true }
  }
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user-role')?.value
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const { data: currentUser } = await supabase
      .from('user')
      .select('*, admin(*)')
      .eq('auth_id', user.id)
      .single()
    
    if (!currentUser || !currentUser.admin || currentUser.admin.length === 0) {
      return { success: false, error: 'Admin record not found' }
    }
    
    const adminRecord = currentUser.admin[0]
    
    if (userRole === 'admin') {
      const { data: pendingSuperusers } = await supabase
        .from('admin')
        .select('*, user(*)')
        .eq('role', 'superuser')
        .eq('status', 'pending')
        .eq('grade', adminRecord.grade)
        .eq('tenant', adminRecord.tenant)
      
      const { data: pendingKids } = await supabase
        .from('enrollment')
        .select('*, user(*), class:classes(grade)')
        .eq('status', 'pending')
      
      const filteredKids = (pendingKids || []).filter(e => e.class?.grade === adminRecord.grade)
      
      const { data: acceptedSuperusers } = await supabase
        .from('admin')
        .select('id')
        .eq('role', 'superuser')
        .eq('status', 'accepted')
        .eq('grade', adminRecord.grade)
        .eq('tenant', adminRecord.tenant)
      
      const { data: acceptedKids } = await supabase
        .from('enrollment')
        .select('*, class:classes(grade)')
        .eq('status', 'accepted')
      
      const filteredAcceptedKids = (acceptedKids || []).filter(e => e.class?.grade === adminRecord.grade)
      
      return { success: true, data: {
        totalUsers: (acceptedSuperusers?.length || 0) + (filteredAcceptedKids?.length || 0),
        pendingCount: (pendingSuperusers?.length || 0) + filteredKids.length,
        lastUpdated: new Date().toISOString()
      }}
    } else {
      const { data: pendingKids } = await supabase
        .from('enrollment')
        .select('*, user(*), class:classes(grade)')
        .eq('status', 'pending')
      
      const filteredKids = (pendingKids || []).filter(e => e.class?.grade === adminRecord.grade)
      
      const { data: acceptedKids } = await supabase
        .from('enrollment')
        .select('*, class:classes(grade)')
        .eq('status', 'accepted')
      
      const filteredAcceptedKids = (acceptedKids || []).filter(e => e.class?.grade === adminRecord.grade)
      
      return { success: true, data: {
        totalUsers: filteredAcceptedKids?.length || 0,
        pendingCount: filteredKids.length,
        lastUpdated: new Date().toISOString()
      }}
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getTodayAdminReading() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: userData } = await supabase
      .from('user')
      .select('admin(grade, tenant)')
      .eq('auth_id', user.id)
      .single()

    const adminData = userData?.admin?.[0]
    if (!adminData) return { success: false, error: 'Admin not found' }

    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

    const { data: readings } = await supabase
      .from('reading')
      .select('grade, book, chapter, from_verse, to_verse')
      .eq('tenant', adminData.tenant)
      .eq('day', today)

    const reading = readings?.find(r => r.grade === adminData.grade) ?? readings?.find(r => r.grade === null) ?? null

    if (!reading) return { success: true, data: null }

    return { success: true, data: {
      book: reading.book,
      chapter: reading.chapter,
      fromVerse: reading.from_verse,
      toVerse: reading.to_verse,
      verseCount: reading.to_verse - reading.from_verse + 1
    }}
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export type ClassAnalytics = {
  className: string
  totalKids: number
  readingPct: number
  correctPct: number
}

export type Analytics = {
  overallReadingPct: number
  overallCorrectPct: number
  byClass: ClassAnalytics[]
}

export async function getAnalytics(): Promise<{ success: boolean; data?: Analytics; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: userData } = await supabase
      .from('user')
      .select('id, gender, admin(grade, tenant)')
      .eq('auth_id', user.id)
      .single()

    const adminData = userData?.admin?.[0]
    if (!adminData) return { success: false, error: 'Admin not found' }

    const { grade } = adminData

    // Get grade gender to apply same mixed/gender restriction
    const { data: gradeData } = await supabase
      .from('grade')
      .select('gender')
      .eq('grade_num', grade)
      .single()

    const isMixed = gradeData?.gender === 'mix' || gradeData?.gender === 'mixed'
    const adminGender = userData!.gender

    // Get all classes for this grade
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .eq('grade', grade)

    if (!classes?.length) return { success: true, data: { overallReadingPct: 0, overallCorrectPct: 0, byClass: [] } }

    // Get all enrollments with user gender
    const { data: enrollments } = await supabase
      .from('enrollment')
      .select('user_id, class, user!inner(gender)')
      .in('class', classes.map(c => c.id))
      .eq('status', 'accepted')

    type Enrollment = { user_id: string; class: string; user: { gender: string }[] }
    const filteredEnrollments = isMixed
      ? (enrollments || []) as unknown as Enrollment[]
      : (enrollments as unknown as Enrollment[] || []).filter(e => e.user?.[0]?.gender === adminGender)

    const allUserIds = filteredEnrollments.map(e => (e as Enrollment).user_id)
    if (!allUserIds.length) return { success: true, data: { overallReadingPct: 0, overallCorrectPct: 0, byClass: [] } }

    // Get all readings for this grade (all history)
    const { data: readings } = await supabase
      .from('reading')
      .select('id')
      .eq('grade', grade)

    const readingIds = readings?.map(r => r.id) || []
    if (!readingIds.length) return { success: true, data: { overallReadingPct: 0, overallCorrectPct: 0, byClass: [] } }

    // Get all completions for these users & readings
    const { data: completions } = await supabase
      .from('readinghistory')
      .select('user_id, reading')
      .in('user_id', allUserIds)
      .in('reading', readingIds)

    // Get all attempts and correct answers for these users
    const { data: attempts } = await supabase
      .from('attempts')
      .select('user_id, question, option')
      .in('user_id', allUserIds)

    // Get all questions for these readings to find correct answers
    const { data: questions } = await supabase
      .from('question')
      .select('id')
      .in('reading', readingIds)

    const questionIds = questions?.map(q => q.id) || []

    const { data: correctAnswers } = questionIds.length ? await supabase
      .from('correctanswers')
      .select('question, correct_option')
      .in('question', questionIds) : { data: [] }

    const correctSet = new Set((correctAnswers || []).map(ca => `${ca.question}:${ca.correct_option}`))

    const byClass: ClassAnalytics[] = classes.map(cls => {
      const classEnrollments = filteredEnrollments.filter(e => (e as { class: string }).class === cls.id)
      const classUserIds = new Set(classEnrollments.map(e => (e as { user_id: string }).user_id))
      const totalKids = classUserIds.size

      if (totalKids === 0) return { className: cls.name, totalKids: 0, readingPct: 0, correctPct: 0 }

      // Reading %: completions / (totalKids * totalReadings)
      const classCompletions = (completions || []).filter(c => classUserIds.has(c.user_id))
      const totalPossible = totalKids * readingIds.length
      const readingPct = totalPossible > 0 ? Math.round((classCompletions.length / totalPossible) * 100) : 0

      // Correct %: correct attempts / total attempts for class users
      const classAttempts = (attempts || []).filter(a => classUserIds.has(a.user_id))
      const correctCount = classAttempts.filter(a => correctSet.has(`${a.question}:${a.option}`)).length
      const correctPct = classAttempts.length > 0 ? Math.round((correctCount / classAttempts.length) * 100) : 0

      return { className: cls.name, totalKids, readingPct, correctPct }
    })

    // Overall
    const totalPossible = allUserIds.length * readingIds.length
    const overallReadingPct = totalPossible > 0 ? Math.round(((completions?.length || 0) / totalPossible) * 100) : 0
    const totalAttempts = attempts?.length || 0
    const correctCount = (attempts || []).filter(a => correctSet.has(`${a.question}:${a.option}`)).length
    const overallCorrectPct = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

    return { success: true, data: { overallReadingPct, overallCorrectPct, byClass } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

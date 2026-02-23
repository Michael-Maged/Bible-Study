'use server'

import { createClient } from '@/utils/supabase/server'

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
        age: user.age,
        gender: user.gender,
        points: 1250, // TODO: Calculate from completed readings
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
      .select('*, enrollment(*, class:classes(*, grade:grade(*)))')
      .eq('auth_id', authUser.id)
      .single()

    console.log('User with grade data:', JSON.stringify(user, null, 2))

    if (!user || !user.enrollment?.[0]?.class?.grade) {
      return { success: false, error: 'User enrollment or grade not found' }
    }

    const gradeData = user.enrollment[0].class.grade
    const gradeNum = gradeData.grade_num
    const tenant = gradeData.tenant
    const today = new Date().toISOString().split('T')[0]

    console.log('Searching for reading:', { gradeNum, tenant, today })

    const { data: readings, error: readingError } = await supabase
      .from('reading')
      .select('*')
      .eq('tenant', tenant)
      .or(`grade.eq.${gradeNum},grade.is.null`)

    console.log('All readings:', readings)

    // Prioritize: grade-specific first, then tenant-wide (only for today)
    let reading = readings?.find(r => r.day === today && r.grade === gradeNum)
    
    if (!reading) {
      reading = readings?.find(r => r.day === today && r.grade === null)
    }

    if (!reading) {
      return { success: false, error: 'No reading assigned' }
    }

    const response = await fetch(
      `https://arabic-bible.onrender.com/api?book=${reading.book}&ch=${reading.chapter}&ver=${reading.from_verse}:${reading.to_verse}`
    )
    const bibleData = await response.json()

    return {
      success: true,
      data: {
        book: reading.book,
        chapter: reading.chapter,
        fromVerse: reading.from_verse,
        toVerse: reading.to_verse,
        text: bibleData.arr || [bibleData.text],
        bookName: bibleData.book_name || 'Genesis',
        reference: `${bibleData.book_name || 'Genesis'} ${reading.chapter}:${reading.from_verse}-${reading.to_verse}`
      }
    }
  } catch (error: any) {
    console.error('getTodayReading error:', error)
    return { success: false, error: error.message }
  }
}

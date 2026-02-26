'use server'

import { createClient } from '@/utils/supabase/server'

export async function getReadingHistory() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('user')
      .select('id, streak, best_streak')
      .eq('auth_id', authUser.id)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { data: history } = await supabase
      .from('readinghistory')
      .select('reading!inner(day)')
      .eq('user_id', user.id)

    const completedDays = history?.map(h => h.reading?.day).filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) || []
    const totalDays = completedDays.length

    return {
      success: true,
      data: {
        totalDays,
        currentStreak: user.streak || 0,
        longestStreak: user.best_streak || 0,
        completedDays
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

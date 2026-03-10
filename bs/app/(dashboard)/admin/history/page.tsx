'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getFutureReadings } from './actions'
import { cacheAdminHistory, getCachedAdminHistory, isOnline } from '@/utils/offlineCache'

const bibleBooks = [
  { id: 1, name: 'سفر التكوين' }, { id: 2, name: 'سفر الخروج' }, { id: 3, name: 'سفر اللاويين' },
  { id: 4, name: 'سفر العدد' }, { id: 5, name: 'سفر التثنية' }, { id: 6, name: 'سفر يشوع' },
  { id: 7, name: 'سفر القضاة' }, { id: 8, name: 'سفر راعوث' }, { id: 9, name: 'سفر صموئيل الأول' },
  { id: 10, name: 'سفر صموئيل الثاني' }, { id: 11, name: 'سفر الملوك الأول' }, { id: 12, name: 'سفر الملوك الثاني' },
  { id: 13, name: 'سفر أخبار الأيام الأول' }, { id: 14, name: 'سفر أخبار الأيام الثاني' }, { id: 15, name: 'سفر عزرا' },
  { id: 16, name: 'سفر نحميا' }, { id: 17, name: 'سفر طوبيا' }, { id: 18, name: 'سفر يهوديت' },
  { id: 19, name: 'سفر أستير' }, { id: 20, name: 'تتمة سفر أستير' }, { id: 21, name: 'سفر أيوب' },
  { id: 22, name: 'سفر المزامير' }, { id: 23, name: 'المزمور المائة والحادي والخمسون' }, { id: 24, name: 'سفر الأمثال' },
  { id: 25, name: 'سفر الجامعة' }, { id: 26, name: 'سفر نشيد الأنشاد' }, { id: 27, name: 'سفر الحكمة' },
  { id: 28, name: 'سفر يشوع بن سيراخ' }, { id: 29, name: 'سفر إشعياء' }, { id: 30, name: 'سفر إرميا' },
  { id: 31, name: 'سفر مراثي إرميا' }, { id: 32, name: 'سفر باروخ' }, { id: 33, name: 'سفر حزقيال' },
  { id: 34, name: 'سفر دانيال' }, { id: 35, name: 'تتمة سفر دانيال' }, { id: 36, name: 'سفر هوشع' },
  { id: 37, name: 'سفر يوئيل' }, { id: 38, name: 'سفر عاموس' }, { id: 39, name: 'سفر عوبديا' },
  { id: 40, name: 'سفر يونان' }, { id: 41, name: 'سفر ميخا' }, { id: 42, name: 'سفر ناحوم' },
  { id: 43, name: 'سفر حبقوق' }, { id: 44, name: 'سفر صفنيا' }, { id: 45, name: 'سفر حجي' },
  { id: 46, name: 'سفر زكريا' }, { id: 47, name: 'سفر ملاخي' }, { id: 48, name: 'سفر المكابيين الأول' },
  { id: 49, name: 'سفر المكابيين الثاني' }, { id: 50, name: 'إنجيل متى' }, { id: 51, name: 'إنجيل مرقس' },
  { id: 52, name: 'إنجيل لوقا' }, { id: 53, name: 'إنجيل يوحنا' }, { id: 54, name: 'سفر أعمال الرسل' },
  { id: 55, name: 'رسالة بولس الرسول إلى أهل رومية' }, { id: 56, name: 'رسالة بولس الرسول الأولى إلى أهل كورنثوس' },
  { id: 57, name: 'رسالة بولس الرسول الثانية إلى أهل كورنثوس' }, { id: 58, name: 'رسالة بولس الرسول إلى أهل غلاطية' },
  { id: 59, name: 'رسالة بولس الرسول إلى أهل أفسس' }, { id: 60, name: 'رسالة بولس الرسول إلى أهل فيلبي' },
  { id: 61, name: 'رسالة بولس الرسول إلى أهل كولوسي' }, { id: 62, name: 'رسالة بولس الرسول الأولى إلى أهل تسالونيكي' },
  { id: 63, name: 'رسالة بولس الرسول الثانية إلى أهل تسالونيكي' }, { id: 64, name: 'رسالة بولس الرسول الأولى إلى تيموثاوس' },
  { id: 65, name: 'رسالة بولس الرسول الثانية إلى تيموثاوس' }, { id: 66, name: 'رسالة بولس الرسول إلى تيطس' },
  { id: 67, name: 'رسالة بولس الرسول إلى فليمون' }, { id: 68, name: 'رسالة بولس الرسول إلى العبرانيين' },
  { id: 69, name: 'رسالة يعقوب' }, { id: 70, name: 'رسالة بطرس الرسول الأولى' }, { id: 71, name: 'رسالة بطرس الرسول الثانية' },
  { id: 72, name: 'رسالة يوحنا الرسول الأولى' }, { id: 73, name: 'رسالة يوحنا الرسول الثانية' }, { id: 74, name: 'رسالة يوحنا الرسول الثالثة' },
  { id: 75, name: 'رسالة يهوذا' }, { id: 76, name: 'سفر رؤيا يوحنا اللاهوت' }
]

export default function HistoryPage() {
  const router = useRouter()
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReadings()
  }, [])

  const loadReadings = async () => {
    if (!isOnline()) {
      const cached = getCachedAdminHistory()
      if (cached) {
        setReadings(cached)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    const result = await getFutureReadings()
    if (result.success && result.data) {
      setReadings(result.data)
      cacheAdminHistory(result.data)
    }
    setLoading(false)
  }

  const getBookName = (bookId: number) => {
    return bibleBooks.find(b => b.id === bookId)?.name || `Book ${bookId}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-white min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-[#59f20d]/10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <span className="text-xl">←</span>
          </button>
          <div>
            <h1 className="text-lg font-bold leading-none">Reading History</h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">Future Assignments</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#59f20d] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-zinc-500">Loading readings...</p>
            </div>
          </div>
        ) : readings.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
            <span className="text-5xl mb-3 block">📚</span>
            <p className="font-bold mb-1">No Future Readings</p>
            <p className="text-sm text-zinc-500">No readings have been scheduled yet</p>
          </div>
        ) : (
          readings.map((reading) => (
            <div key={reading.id} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📖</span>
                    <h3 className="font-bold text-base">{getBookName(reading.book)}</h3>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Chapter {reading.chapter}, Verses {reading.from_verse}-{reading.to_verse}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                  📅 {formatDate(reading.day)}
                </span>
                {reading.grade ? (
                  <>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold">
                      🎓 Grade {typeof reading.grade === 'object' ? reading.grade.grade_num : reading.grade}
                    </span>
                    {typeof reading.grade === 'object' && reading.grade.gender && (
                      <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-xs font-bold">
                        {reading.grade.gender === 'male' ? '👦 Boys' : reading.grade.gender === 'female' ? '👧 Girls' : '👥 Mixed'}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                    🏢 Whole Tenant
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
          <button onClick={() => router.push('/admin')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-black uppercase mt-1">Dashboard</span>
          </button>
          <button onClick={() => router.push('/admin/assignments')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-black uppercase mt-1">Content</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center py-2 bg-[#59f20d] rounded-full text-slate-900">
            <span className="text-2xl">📚</span>
            <span className="text-[10px] font-black uppercase mt-1">History</span>
          </button>
          <button onClick={() => router.push('/admin/kids')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-black uppercase mt-1">Kids</span>
          </button>
          <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center py-2 text-red-500 hover:text-red-400 transition-colors">
            <span className="text-2xl">❌</span>
            <span className="text-[10px] font-black uppercase mt-1">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { saveReadingAction, saveQuestionsAction } from './actions'
import type { QuestionBuilder, QuestionOptionBuilder, BibleBookInfo, BibleChapterInfo } from '@/types'

export default function AssignmentsPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(() => {
    if (typeof window !== 'undefined') return new Date()
    return new Date('2026-02-27')
  })
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') return new Date()
    return new Date('2026-02-27')
  })
  const [bookId, setBookId] = useState('')
  const [chapter, setChapter] = useState('')
  const [verseFrom, setVerseFrom] = useState('')
  const [verseTo, setVerseTo] = useState('')
  const [versePreview, setVersePreview] = useState<string[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [chapterInfo, setChapterInfo] = useState<BibleChapterInfo | null>(null)
  const [bookInfo, setBookInfo] = useState<BibleBookInfo | null>(null)
  const [userGrade, setUserGrade] = useState<number | null>(null)
  const [userTenant, setUserTenant] = useState<string | null>(null)
  const [isWholeTenant, setIsWholeTenant] = useState(false)
  const [questions, setQuestions] = useState<QuestionBuilder[]>([{ question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null)
  const [bibleBooks] = useState([
    { id: 1, name: 'سفر التكوين' },
    { id: 2, name: 'سفر الخروج' },
    { id: 3, name: 'سفر اللاويين' },
    { id: 4, name: 'سفر العدد' },
    { id: 5, name: 'سفر التثنية' },
    { id: 6, name: 'سفر يشوع' },
    { id: 7, name: 'سفر القضاة' },
    { id: 8, name: 'سفر راعوث' },
    { id: 9, name: 'سفر صموئيل الأول' },
    { id: 10, name: 'سفر صموئيل الثاني' },
    { id: 11, name: 'سفر الملوك الأول' },
    { id: 12, name: 'سفر الملوك الثاني' },
    { id: 13, name: 'سفر أخبار الأيام الأول' },
    { id: 14, name: 'سفر أخبار الأيام الثاني' },
    { id: 15, name: 'سفر عزرا' },
    { id: 16, name: 'سفر نحميا' },
    { id: 17, name: 'سفر طوبيا' },
    { id: 18, name: 'سفر يهوديت' },
    { id: 19, name: 'سفر أستير' },
    { id: 20, name: 'تتمة سفر أستير' },
    { id: 21, name: 'سفر أيوب' },
    { id: 22, name: 'سفر المزامير' },
    { id: 23, name: 'المزمور المائة والحادي والخمسون' },
    { id: 24, name: 'سفر الأمثال' },
    { id: 25, name: 'سفر الجامعة' },
    { id: 26, name: 'سفر نشيد الأنشاد' },
    { id: 27, name: 'سفر الحكمة' },
    { id: 28, name: 'سفر يشوع بن سيراخ' },
    { id: 29, name: 'سفر إشعياء' },
    { id: 30, name: 'سفر إرميا' },
    { id: 31, name: 'سفر مراثي إرميا' },
    { id: 32, name: 'سفر باروخ' },
    { id: 33, name: 'سفر حزقيال' },
    { id: 34, name: 'سفر دانيال' },
    { id: 35, name: 'تتمة سفر دانيال' },
    { id: 36, name: 'سفر هوشع' },
    { id: 37, name: 'سفر يوئيل' },
    { id: 38, name: 'سفر عاموس' },
    { id: 39, name: 'سفر عوبديا' },
    { id: 40, name: 'سفر يونان' },
    { id: 41, name: 'سفر ميخا' },
    { id: 42, name: 'سفر ناحوم' },
    { id: 43, name: 'سفر حبقوق' },
    { id: 44, name: 'سفر صفنيا' },
    { id: 45, name: 'سفر حجي' },
    { id: 46, name: 'سفر زكريا' },
    { id: 47, name: 'سفر ملاخي' },
    { id: 48, name: 'سفر المكابيين الأول' },
    { id: 49, name: 'سفر المكابيين الثاني' },
    { id: 50, name: 'إنجيل متى' },
    { id: 51, name: 'إنجيل مرقس' },
    { id: 52, name: 'إنجيل لوقا' },
    { id: 53, name: 'إنجيل يوحنا' },
    { id: 54, name: 'سفر أعمال الرسل' },
    { id: 55, name: 'رسالة بولس الرسول إلى أهل رومية' },
    { id: 56, name: 'رسالة بولس الرسول الأولى إلى أهل كورنثوس' },
    { id: 57, name: 'رسالة بولس الرسول الثانية إلى أهل كورنثوس' },
    { id: 58, name: 'رسالة بولس الرسول إلى أهل غلاطية' },
    { id: 59, name: 'رسالة بولس الرسول إلى أهل أفسس' },
    { id: 60, name: 'رسالة بولس الرسول إلى أهل فيلبي' },
    { id: 61, name: 'رسالة بولس الرسول إلى أهل كولوسي' },
    { id: 62, name: 'رسالة بولس الرسول الأولى إلى أهل تسالونيكي' },
    { id: 63, name: 'رسالة بولس الرسول الثانية إلى أهل تسالونيكي' },
    { id: 64, name: 'رسالة بولس الرسول الأولى إلى تيموثاوس' },
    { id: 65, name: 'رسالة بولس الرسول الثانية إلى تيموثاوس' },
    { id: 66, name: 'رسالة بولس الرسول إلى تيطس' },
    { id: 67, name: 'رسالة بولس الرسول إلى فليمون' },
    { id: 68, name: 'رسالة بولس الرسول إلى العبرانيين' },
    { id: 69, name: 'رسالة يعقوب' },
    { id: 70, name: 'رسالة بطرس الرسول الأولى' },
    { id: 71, name: 'رسالة بطرس الرسول الثانية' },
    { id: 72, name: 'رسالة يوحنا الرسول الأولى' },
    { id: 73, name: 'رسالة يوحنا الرسول الثانية' },
    { id: 74, name: 'رسالة يوحنا الرسول الثالثة' },
    { id: 75, name: 'رسالة يهوذا' },
    { id: 76, name: 'سفر رؤيا يوحنا اللاهوت' }
  ])
  const [isLoadingBooks] = useState(false)

  const changeMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    
    const days = []
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }
    return days
  }

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/login'
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('user')
          .select('*, admin(*)')
          .eq('auth_id', user.id)
          .single()
        
        if (userData?.admin?.[0]) {
          setUserGrade(userData.admin[0].grade)
          setUserTenant(userData.admin[0].tenant)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  useEffect(() => {
    if (bookId) {
      fetchBookInfo()
      setChapter('')
      setVerseFrom('')
      setVerseTo('')
      setChapterInfo(null)
    }
  }, [bookId])

  const fetchBookInfo = async () => {
    try {
      const response = await fetch(`/api/bible?book=${bookId}`)
      const data = await response.json()
      setBookInfo(data)
    } catch (error) {
      console.error('Error fetching book info:', error)
    }
  }

  useEffect(() => {
    if (bookId && chapter) {
      fetchChapterInfo()
      setVerseFrom('')
      setVerseTo('')
    }
  }, [bookId, chapter])

  const fetchChapterInfo = async () => {
    try {
      const response = await fetch(`/api/bible?book=${bookId}&ch=${chapter}`)
      const data = await response.json()
      setChapterInfo(data)
    } catch (error) {
      console.error('Error fetching chapter info:', error)
    }
  }

  const loadPreview = async () => {
    if (!bookId || !chapter) return
    
    setIsLoadingPreview(true)
    try {
      let url = `/api/bible?book=${bookId}&ch=${chapter}`
      
      if (verseFrom && verseTo) {
        url += `&ver=${verseFrom}:${verseTo}`
      } else if (verseFrom) {
        url += `&ver=${verseFrom}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.arr) {
        setVersePreview(data.arr)
      } else if (data.text) {
        setVersePreview([data.text])
      }
    } catch (error) {
      console.error('Error loading preview:', error)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const clearSelection = () => {
    setVerseFrom('')
    setVerseTo('')
    setVersePreview([])
  }

  const selectFullChapter = () => {
    if (chapterInfo) {
      setVerseFrom('1')
      setVerseTo(chapterInfo.verses_count.toString())
    }
  }

  const saveReading = async () => {
    if (!bookId || !chapter || !verseFrom || !verseTo || !selectedDate) {
      alert('Please fill all fields')
      return
    }

    if (!userGrade || !userTenant) {
      alert('User data not loaded')
      return
    }

    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`

    try {
      const response = await fetch('/api/bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: parseInt(bookId),
          chapter: parseInt(chapter),
          from_verse: parseInt(verseFrom),
          to_verse: parseInt(verseTo),
          day: dateString,
          grade: isWholeTenant ? null : userGrade,
          tenant: userTenant
        })
      })

      const result = await response.json()
      if (result.success) {
        const readingId = result.data[0].id
        
        for (const q of questions) {
          if (!q.question.trim() || q.options.length < 2) continue
          
          const hasCorrect = q.options.some((opt: QuestionOptionBuilder) => opt.isCorrect)
          if (!hasCorrect) continue
          
          const hasEmptyOption = q.options.some((opt: QuestionOptionBuilder) => !opt.text.trim())
          if (hasEmptyOption) continue
          
          await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reading: readingId,
              question: q.question,
              score: q.score,
              options: q.options
            })
          })
        }
        
        alert('Reading and questions saved successfully!')
        setQuestions([{ question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
        setSavedReadingId(null)
        clearSelection()
        setBookId('')
        setChapter('')
      } else {
        alert('Error saving reading')
      }
    } catch (error) {
      console.error('Error saving reading:', error)
      alert('Error saving reading')
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, { question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: string | number) => {
    const updated = [...questions] as QuestionBuilder[]
    ;(updated[index] as Record<string, string | number | QuestionOptionBuilder[]>)[field] = value
    setQuestions(updated)
  }

  const addOption = (qIndex: number) => {
    const updated = [...questions]
    updated[qIndex].options.push({ text: '', isCorrect: false })
    setQuestions(updated)
  }

  const updateOption = (qIndex: number, oIndex: number, field: string, value: string | boolean) => {
    const updated = [...questions] as QuestionBuilder[]
    ;(updated[qIndex].options[oIndex] as Record<string, string | boolean>)[field] = value
    setQuestions(updated)
  }

  const setCorrectAnswer = (qIndex: number, oIndex: number) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex].isCorrect = !updated[qIndex].options[oIndex].isCorrect
    setQuestions(updated)
  }

  const saveQuestions = async () => {
    if (!savedReadingId) {
      alert('Please save reading first')
      return
    }

    try {
      for (const q of questions) {
        if (!q.question.trim() || q.options.length < 2) {
          alert('Each question must have text and at least 2 options')
          return
        }
        
        const hasCorrect = q.options.some((opt: QuestionOptionBuilder) => opt.isCorrect)
        if (!hasCorrect) {
          alert('Each question must have at least one correct answer marked')
          return
        }
        
        const hasEmptyOption = q.options.some((opt: QuestionOptionBuilder) => !opt.text.trim())
        if (hasEmptyOption) {
          alert('All options must have text')
          return
        }
        
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reading: savedReadingId,
            question: q.question,
            score: q.score,
            options: q.options
          })
        })
        
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error)
        }
      }
      
      alert('Questions saved successfully!')
      setQuestions([{ question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
      setSavedReadingId(null)
      clearSelection()
      setBookId('')
      setChapter('')
    } catch (error) {
      console.error('Error saving questions:', error)
      alert('Error saving questions: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-[#121c0d] dark:text-white min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-[#59f20d]/10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <span className="text-xl">←</span>
          </button>
          <div>
            <h1 className="text-lg font-bold leading-none">Bible Reading</h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">Daily Configuration</p>
          </div>
        </div>
        <button onClick={saveReading} className="bg-[#59f20d] text-[#121c0d] px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform">
          Publish
        </button>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-xl">📅</span>
            <h2 className="text-lg font-bold">Schedule</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                <span className="text-xl">←</span>
              </button>
              <p className="font-bold text-base">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                <span className="text-xl">→</span>
              </button>
            </div>
            <div className="grid grid-cols-7 text-center gap-y-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <span key={i} className="text-[10px] font-bold text-zinc-400 uppercase">{day}</span>
              ))}
              {getDaysInMonth().map((item, i) => {
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day)
                const isSelected = selectedDate.toDateString() === dateObj.toDateString()
                return (
                  <button 
                    key={i} 
                    onClick={() => item.isCurrentMonth && setSelectedDate(dateObj)} 
                    disabled={!item.isCurrentMonth}
                    className={`h-8 w-8 mx-auto flex items-center justify-center text-sm font-medium rounded-full ${
                      isSelected ? 'bg-[#59f20d] text-black shadow-md font-bold' : 
                      !item.isCurrentMonth ? 'text-zinc-300 cursor-not-allowed' : 
                      'hover:bg-[#59f20d]/20'
                    }`}
                  >
                    {item.day}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-xl">📖</span>
            <h2 className="text-lg font-bold">Passage</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <input 
                type="checkbox" 
                id="wholeTenant" 
                checked={isWholeTenant}
                onChange={(e) => setIsWholeTenant(e.target.checked)}
                className="w-5 h-5 text-[#59f20d] bg-white border-gray-300 rounded focus:ring-[#59f20d]"
              />
              <label htmlFor="wholeTenant" className="text-sm font-bold text-blue-700 dark:text-blue-300 cursor-pointer">
                📢 Assign to Whole Tenant (All Grades)
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Bible Book</label>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d] focus:border-[#59f20d] transition-all" disabled={isLoadingBooks}>
                <option value="">{isLoadingBooks ? 'Loading...' : 'Select Book'}</option>
                {bibleBooks.map(book => (
                  <option key={book.id} value={book.id}>{book.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Chapter</label>
                <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" disabled={!bookInfo}>
                  <option value="">Select Chapter</option>
                  {bookInfo && Array.from({ length: bookInfo.chapters }, (_, i) => i + 1).map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
                {chapterInfo && (
                  <p className="text-xs text-zinc-500 mt-1">{chapterInfo.verses_count} verses</p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Verses</label>
                <div className="flex items-center gap-2">
                  <select value={verseFrom} onChange={(e) => setVerseFrom(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" disabled={!chapterInfo}>
                    <option value="">From</option>
                    {chapterInfo && Array.from({ length: chapterInfo.verses_count }, (_, i) => i + 1).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <span className="text-zinc-400">-</span>
                  <select value={verseTo} onChange={(e) => setVerseTo(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" disabled={!chapterInfo}>
                    <option value="">To</option>
                    {chapterInfo && Array.from({ length: chapterInfo.verses_count }, (_, i) => i + 1).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={selectFullChapter} disabled={!chapterInfo} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50">
                Full Chapter
              </button>
              <button onClick={loadPreview} disabled={!bookId || !chapter || isLoadingPreview} className="flex-1 bg-[#59f20d] text-[#121c0d] px-4 py-2 rounded-lg text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50">
                {isLoadingPreview ? 'Loading...' : 'Preview'}
              </button>
              <button onClick={clearSelection} className="px-4 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                Clear
              </button>
            </div>
          </div>
        </section>

        {versePreview.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[#59f20d] text-xl">👁️</span>
              <h2 className="text-lg font-bold">Verse Preview</h2>
            </div>
            <div className="bg-gradient-to-br from-[#59f20d]/10 to-[#59f20d]/5 rounded-xl p-5 shadow-sm border border-[#59f20d]/20 space-y-3 max-h-96 overflow-y-auto">
              {versePreview.map((verse, index) => (
                <div key={index} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm leading-relaxed">{verse}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[#59f20d] text-xl">❓</span>
              <h2 className="text-lg font-bold">Daily Quiz</h2>
            </div>
            <button onClick={addQuestion} className="text-[#59f20d] text-sm font-bold flex items-center gap-1">
              <span className="text-base">➕</span> New Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border-l-4 border-[#59f20d] border-y border-r border-zinc-100 dark:border-zinc-800 space-y-4">
              <div className="flex justify-between items-start">
                <span className="bg-[#59f20d]/10 text-[#659c49] text-[10px] font-bold px-2 py-1 rounded-full uppercase">Question {qIndex + 1}</span>
                <button onClick={() => removeQuestion(qIndex)} className="text-zinc-400 hover:text-red-500">🗑️</button>
              </div>
              <textarea value={q.question} onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d] placeholder:text-zinc-400" placeholder="Type the question here..." rows={2}></textarea>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Score</label>
                <input type="number" value={q.score} onChange={(e) => updateQuestion(qIndex, 'score', parseInt(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" min="1" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block ml-1">Answer Choices (Click ○ to mark correct)</label>
                {q.options.map((opt: QuestionOptionBuilder, oIndex: number) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2">
                      <input value={opt.text} onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)} className="bg-transparent border-none p-0 w-full text-sm focus:ring-0" type="text" placeholder={`Option ${oIndex + 1}`} />
                    </div>
                    <button onClick={() => setCorrectAnswer(qIndex, oIndex)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${opt.isCorrect ? 'border-[#59f20d] bg-[#59f20d] text-[#121c0d] scale-110' : 'border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-[#59f20d]'}`}>
                      {opt.isCorrect ? '✓' : '○'}
                    </button>
                  </div>
                ))}
                {q.options.length < 4 && (
                  <button onClick={() => addOption(qIndex)} className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-400 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    + Add Choice
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {savedReadingId && (
            <button onClick={saveQuestions} className="w-full bg-[#59f20d] text-black px-4 py-3 rounded-lg font-bold hover:scale-105 transition-transform">
              Save All Questions
            </button>
          )}
        </section>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
          <button onClick={() => router.push('/admin')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-black uppercase mt-1">Dashboard</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center py-2 bg-[#59f20d] rounded-full text-slate-900">
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-black uppercase mt-1">Content</span>
          </button>
          <button onClick={() => router.push('/admin/history')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
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

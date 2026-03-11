'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { getTodayReading, markReadingComplete, getUserProfile } from './actions'
import { cacheReading, getCachedReading, isOnline, preloadAllData } from '@/utils/offlineCache'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import { getReadingHistory } from '../history/actions'
import { getLeaderboard, getCurrentUserRank } from '../leaderboard/actions'

export default function DashboardPage() {
  console.log('DashboardPage component rendering')
  const router = useRouter()
  const [reading, setReading] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [pendingCompletion, setPendingCompletion] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)

  useEffect(() => {
    loadReading()
    const pending = localStorage.getItem('pending_completion')
    if (pending) setPendingCompletion(pending)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadReading = async () => {
    console.log('loadReading called')
    setLoading(true)

    if (!navigator.onLine) {
      const cached = getCachedReading()
      console.log('Offline, using cache')
      setReading(cached?.data || null)
      setLoading(false)
      return
    }

    try {
      console.log('Calling getTodayReading...')
      const result = await getTodayReading()
      console.log('getTodayReading result:', result)
      
      if (result.success) {
        console.log('Full reading data:', result.data)
        
        // Fetch correct answer counts for each question
        if (result.data){
          if (result.data.questions && result.data.questions.length > 0) {
            const questionsWithCounts = await Promise.all(
              result.data.questions.map(async (q: any) => {
                const countRes = await fetch(`/api/questions/correct-count?questionId=${q.id}`)
                const countData = await countRes.json()
                return { ...q, correctCount: countData.count || 1 }
              })
            )
            result.data.questions = questionsWithCounts
          }
        }
        
        setReading(result.data)
        cacheReading(result.data)
      } else {
        console.log('Result not successful:', result.error)
        setReading(null)
        cacheReading(null)
      }
    } catch (error) {
      console.error('Error in loadReading:', error)
      const cached = getCachedReading()
      setReading(cached?.data || null)
    }
    setLoading(false)
    console.log('loadReading completed')
  }

  const handleSubmitQuiz = async () => {
    if (!reading?.questions || reading.questions.length === 0) return
    
    const answers = Object.entries(selectedAnswers).flatMap(([questionId, optionIds]) => 
      optionIds.map(optionId => ({
        questionId,
        optionId
      }))
    )

    const allQuestionsAnswered = reading.questions.every((q: any) => 
      selectedAnswers[q.id] && selectedAnswers[q.id].length > 0
    )

    if (!allQuestionsAnswered) {
      alert('Please answer all questions')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: reading.userId,
          readingId: reading.readingId,
          answers
        })
      })

      const result = await response.json()
      if (result.success) {
        setQuizResults(result)
        const markResult = await markReadingComplete(reading.readingId, reading.userId)
        if (markResult.success) {
          setReading({ ...reading, isCompleted: true, hasAttempted: true })
        }
      } else {
        alert('Error submitting quiz')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz')
    }
    setSubmitting(false)
  }

  const handleMarkComplete = async () => {
    if (!reading?.readingId || reading.isCompleted) return
    
    if (!isOnline()) {
      localStorage.setItem('pending_completion', reading.readingId)
      setPendingCompletion(reading.readingId)
      setReading({ ...reading, isCompleted: true })
      return
    }
    
    setCompleting(true)
    const result = await markReadingComplete(reading.readingId, reading.userId)
    
    if (result.success) {
      setReading({ ...reading, isCompleted: true })
    } else {
      alert(result.error || 'Failed to mark as complete')
    }
    setCompleting(false)
  }

  const getCorrectAnswersCount = (question: any) => {
    return fetch('/api/questions/correct-count?questionId=' + question.id)
      .then(res => res.json())
      .then(data => data.count || 0)
      .catch(() => 0)
  }

  const toggleAnswer = (questionId: string, optionId: string, isMultiple: boolean) => {
    if (quizResults) return
    
    setSelectedAnswers(prev => {
      const current = prev[questionId] || []
      
      if (isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter(id => id !== optionId) }
        } else {
          return { ...prev, [questionId]: [...current, optionId] }
        }
      } else {
        return { ...prev, [questionId]: [optionId] }
      }
    })
  }



  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
    window.location.href = '/login'
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!reading) {
    return (
      <div className="bg-[#f6f8f5] dark:bg-[#162210] min-h-screen flex flex-col">
        <OfflineBanner />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold mb-2">No Reading Today</h2>
            <p className="text-slate-600 dark:text-slate-400">Check back later for today's assignment!</p>
          </div>
        </div>
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
            <button className="flex-1 flex flex-col items-center justify-center py-2 bg-[#59f20d] rounded-full text-slate-900">
              <span className="text-2xl">📖</span>
              <span className="text-[10px] font-black uppercase mt-1">Reading</span>
            </button>
            <button onClick={() => router.push('/kid/history')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
              <span className="text-2xl">📈</span>
              <span className="text-[10px] font-black uppercase mt-1">History</span>
            </button>
            <button onClick={() => router.push('/kid/leaderboard')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
              <span className="text-2xl">📊</span>
              <span className="text-[10px] font-black uppercase mt-1">Leaders</span>
            </button>
            <button onClick={() => router.push('/kid/profile')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-black uppercase mt-1">Profile</span>
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

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen">
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-6 py-4 border-b border-[#59f20d]/10">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#59f20d] p-2 rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-[#59f20d]/20">
            <span className="text-2xl font-bold">📖</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Bible Kids</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-[#59f20d]/20 shadow-sm">
            <span className="text-orange-500 text-xl mr-1">🔥</span>
            <span className="font-bold text-sm">5 Day Streak!</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-[#59f20d] overflow-hidden bg-slate-200 flex items-center justify-center text-2xl">
            😊
          </div>
        </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 pb-32">
        <section className="mb-10 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-black mb-2">Hi! 👋</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Ready for today's adventure with God?</p>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-[#59f20d]/10 shadow-xl mb-10">
          <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <div className="text-8xl">📖</div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-end p-8 flex-col justify-end">
              <span className="bg-[#59f20d] text-slate-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 w-fit">Today's Reading</span>
              <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">{reading.bookName}</h3>
            </div>
          </div>
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#59f20d]/20 px-4 py-2 rounded-full border border-[#59f20d]/20">
                <span className="text-[#59f20d] font-bold">{reading.reference}</span>
              </div>
            </div>
            <div className="space-y-4 text-xl md:text-2xl leading-relaxed font-medium text-right" dir="rtl">
              {reading.text.map((verse: string, idx: number) => {
                const parts = verse.split(/(\d+)\s/)
                let currentVerse: Array<{type: string, text: string}> = []
                let verses: Array<Array<{type: string, text: string}>> = []
                
                parts.forEach((part) => {
                  if (!part.trim()) return
                  
                  if (/^\d+$/.test(part)) {
                    if (currentVerse.length > 0) {
                      verses.push([...currentVerse])
                      currentVerse = []
                    }
                    currentVerse.push({ type: 'number', text: part })
                  } else {
                    currentVerse.push({ type: 'text', text: part })
                  }
                })
                
                if (currentVerse.length > 0) {
                  verses.push(currentVerse)
                }
                
                return verses.map((verseContent, verseIdx) => (
                  <p key={`${idx}-${verseIdx}`} className="leading-relaxed">
                    {verseContent.map((item, itemIdx) => 
                      item.type === 'number' ? (
                        <span key={itemIdx} className="text-[#59f20d] font-bold text-base ml-2">
                          {item.text}
                        </span>
                      ) : (
                        <span key={itemIdx}>{item.text}</span>
                      )
                    )}
                  </p>
                ))
              })}
            </div>
          </div>
          {!reading.isCompleted && !reading.hasAttempted && (!reading.questions || reading.questions.length === 0) && (
            <div className="p-6 border-t border-[#59f20d]/10">
              <button 
                onClick={handleMarkComplete}
                disabled={completing}
                className="w-full bg-[#59f20d] text-slate-900 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing ? 'Marking Complete...' : '✅ Mark as Complete'}
              </button>
            </div>
          )}
          {reading.isCompleted && (
            <div className="p-6 border-t border-[#59f20d]/10 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center gap-3 text-green-700 dark:text-green-400">
                <span className="text-3xl">✅</span>
                <span className="font-bold text-lg">Completed!</span>
              </div>
            </div>
          )}
        </section>

        {reading.questions && reading.questions.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[#59f20d] text-xl">❓</span>
              <h2 className="text-2xl font-black">Quiz Time!</h2>
            </div>
            {reading.questions.map((q: any, idx: number) => {
              const correctCount = q.correctCount || 1
              const isMultiple = correctCount > 1
              console.log(`Question ${q.id}: correctCount=${correctCount}, isMultiple=${isMultiple}`)
              
              return (
                <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-[#59f20d]/10">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="bg-[#59f20d] text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">{idx + 1}</span>
                    <p className="text-lg font-bold flex-1">{q.question}</p>
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">{q.score} pts</span>
                  </div>
                  {isMultiple && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-3 font-medium">ℹ️ Select all correct answers</p>
                  )}
                  <div className="space-y-2">
                    {q.options.map((opt: any) => {
                      const isSelected = selectedAnswers[q.id]?.includes(opt.id)
                      const isCorrectOption = quizResults?.results.some((r: any) => r.optionId === opt.id && r.isCorrect)
                      const isWrongSelection = quizResults && isSelected && !isCorrectOption
                      
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleAnswer(q.id, opt.id, isMultiple)}
                          disabled={!!quizResults}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isCorrectOption ? 'bg-green-100 dark:bg-green-900/30 border-green-500' :
                            isWrongSelection ? 'bg-red-100 dark:bg-red-900/30 border-red-500' :
                            isSelected ? 'bg-[#59f20d]/20 border-[#59f20d]' :
                            'border-zinc-200 dark:border-zinc-700 hover:border-[#59f20d]/50'
                          } disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-3">
                            {isMultiple ? (
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'border-[#59f20d] bg-[#59f20d]' : 'border-zinc-300 dark:border-zinc-600'
                              }`}>
                                {isSelected && <span className="text-slate-900 text-sm">✓</span>}
                              </div>
                            ) : (
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-[#59f20d] bg-[#59f20d]' : 'border-zinc-300 dark:border-zinc-600'
                              }`}>
                                {isSelected && <div className="w-2 h-2 bg-slate-900 rounded-full"></div>}
                              </div>
                            )}
                            <span className="flex-1">{opt.option}</span>
                            {isCorrectOption && <span className="text-green-600 text-xl">✓</span>}
                            {isWrongSelection && <span className="text-red-600 text-xl">✗</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {!quizResults && (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || !reading.questions.every((q: any) => selectedAnswers[q.id]?.length > 0)}
                className="w-full bg-[#59f20d] text-slate-900 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : '🎯 Submit Answers'}
              </button>
            )}
            {quizResults && (
              <div className="bg-gradient-to-br from-[#59f20d]/20 to-[#59f20d]/10 rounded-xl p-6 border border-[#59f20d]/30">
                <div className="text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-2xl font-black mb-2">Reading Complete!</h3>
                  <p className="text-lg font-bold text-[#59f20d]">You earned {quizResults.totalScore} points!</p>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#59f20d]/10 flex items-center gap-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 w-16 h-16 rounded-full flex items-center justify-center">
              <span className="text-yellow-500 text-3xl">⭐</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Stars Collected</p>
              <p className="text-3xl font-black">124</p>
            </div>
          </div>
          <button onClick={() => router.push('/kid/history')} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#59f20d]/10 flex items-center gap-6 hover:border-[#59f20d]/30 transition-colors">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center">
              <span className="text-blue-500 text-3xl">📊</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-500 uppercase">My Progress</p>
              <p className="text-lg font-black">View History</p>
            </div>
          </button>
        </section>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/10">
          <button className="flex-1 flex flex-col items-center justify-center py-2 bg-[#59f20d] rounded-full text-slate-900">
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-black uppercase mt-1">Reading</span>
          </button>
          <button onClick={() => router.push('/kid/history')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📈</span>
            <span className="text-[10px] font-black uppercase mt-1">History</span>
          </button>
          <button onClick={() => router.push('/kid/leaderboard')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">📊</span>
            <span className="text-[10px] font-black uppercase mt-1">Leaders</span>
          </button>
          <button onClick={() => router.push('/kid/profile')} className="flex-1 flex flex-col items-center justify-center py-2 text-white hover:text-[#59f20d] transition-colors">
            <span className="text-2xl">👤</span>
            <span className="text-[10px] font-black uppercase mt-1">Profile</span>
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

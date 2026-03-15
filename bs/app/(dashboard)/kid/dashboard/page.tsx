'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { getTodayReading, markReadingComplete } from './actions'
import { cacheReading, getCachedReading, isOnline } from '@/utils/offlineCache'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import type { TodayReading, QuizResults, Question, QuestionOption, CorrectAnswer, Attempt } from '@/types'
import KidNav from '@/components/KidNav'
import MessageBox from '@/components/MessageBox'


export default function DashboardPage() {
  console.log('DashboardPage component rendering')
  const router = useRouter()
  const [reading, setReading] = useState<TodayReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [pendingCompletion, setPendingCompletion] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
              result.data.questions.map(async (q: Question) => {
                const countRes = await fetch(`/api/questions/correct-count?questionId=${q.id}`)
                const countData = await countRes.json()
                return { ...q, correctCount: countData.count || 1 }
              })
            )
            result.data.questions = questionsWithCounts
          }

          // If user has attempted, populate selectedAnswers and quizResults
          if (result.data.hasAttempted && result.data.attempts && result.data.attempts.length > 0) {
            const answersMap: Record<string, string[]> = {}
            result.data.attempts.forEach((attempt: Attempt) => {
              if (!answersMap[attempt.question]) {
                answersMap[attempt.question] = []
              }
              answersMap[attempt.question].push(attempt.option)
            })
            setSelectedAnswers(answersMap)

            // Create results array for feedback
            const results = result.data.attempts.map((attempt: Attempt) => {
              const isCorrect = result.data.correctAnswers?.some(
                (ca: CorrectAnswer) => ca.question === attempt.question && ca.correct_option === attempt.option
              )
              return { questionId: attempt.question, optionId: attempt.option, isCorrect }
            })

            // Calculate score (only if all answers for a question are correct)
            let totalScore = 0
            const answersByQuestion: Record<string, string[]> = {}
            result.data.attempts.forEach((attempt: Attempt) => {
              if (!answersByQuestion[attempt.question]) {
                answersByQuestion[attempt.question] = []
              }
              answersByQuestion[attempt.question].push(attempt.option)
            })

            const correctByQuestion: Record<string, string[]> = {}
            result.data.correctAnswers?.forEach((ca: CorrectAnswer) => {
              if (!correctByQuestion[ca.question]) {
                correctByQuestion[ca.question] = []
              }
              correctByQuestion[ca.question].push(ca.correct_option)
            })

            Object.keys(answersByQuestion).forEach(questionId => {
              const studentAnswers = answersByQuestion[questionId].sort()
              const correctAnswersForQ = (correctByQuestion[questionId] || []).sort()
              
              const isFullyCorrect = studentAnswers.length === correctAnswersForQ.length &&
                studentAnswers.every((ans, idx) => ans === correctAnswersForQ[idx])
              
              if (isFullyCorrect) {
                const question = result.data.questions?.find((q: Question) => q.id === questionId)
                totalScore += question?.score || 0
              }
            })

            setQuizResults({
              success: true,
              results,
              totalScore,
              correctAnswers: result.data.correctAnswers
            })
          }
        }
        
        setReading(result.data ?? null)
        cacheReading(result.data ?? null)
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

  useEffect(() => {
    loadReading()
    const pending = localStorage.getItem('pending_completion')
    if (pending) setPendingCompletion(pending)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmitQuiz = async () => {
    if (!reading?.questions || reading.questions.length === 0) return
    
    const answers = Object.entries(selectedAnswers).flatMap(([questionId, optionIds]) => 
      optionIds.map(optionId => ({
        questionId,
        optionId
      }))
    )

    const allQuestionsAnswered = reading.questions.every((q: Question) => 
      selectedAnswers[q.id] && selectedAnswers[q.id].length > 0
    )

    if (!allQuestionsAnswered) {
      setFeedback({ type: 'error', message: 'Please answer all questions' })
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
        setFeedback({ type: 'error', message: 'Error submitting quiz' })
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      setFeedback({ type: 'error', message: 'Error submitting quiz' })
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
      setFeedback({ type: 'error', message: result.error || 'Failed to mark as complete' })
    }
    setCompleting(false)
  }

  const getCorrectAnswersCount = (question: Question) => {
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
            <p className="text-slate-600 dark:text-slate-400">Check back later for today&apos;s assignment! </p>
          </div>
        </div>
        <KidNav active="dashboard" />
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
            <span className="font-bold text-sm">{} Day Streak!</span>
          </div>
        </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 pb-32">
        <section className="mb-10 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-black mb-2">Hi! 👋</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Ready for today&apos;s adventure with God?</p>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-[#59f20d]/10 shadow-xl mb-10">
          <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <div className="text-8xl">📖</div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-end p-8 flex-col justify-end">
              <span className="bg-[#59f20d] text-slate-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 w-fit">Today&apos;s Reading</span>
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
                const verses: Array<Array<{type: string, text: string}>> = []
                
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
          <section className="space-y-6 padding-6 md:p-12 bg-white dark:bg-slate-800 rounded-xl border border-[#59f20d]/10 shadow-xl mb-10">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[#59f20d] text-xl">❓</span>
              <h2 className="text-2xl font-black">Quiz Time!</h2>
            </div>
            {reading.questions.map((q: Question, idx: number) => {
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
                    {q.options.map((opt: QuestionOption) => {
                      const isSelected = selectedAnswers[q.id]?.includes(opt.id)
                      const isCorrectOption = quizResults?.correctAnswers?.some((ca: CorrectAnswer) => ca.question === q.id && ca.correct_option === opt.id)
                      const isWrongSelection = quizResults && isSelected && !isCorrectOption
                      
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleAnswer(q.id, opt.id, isMultiple)}
                          disabled={!!quizResults}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            quizResults && isCorrectOption ? 'bg-green-100 dark:bg-green-900/30 border-green-500' :
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
                            {quizResults && isCorrectOption && <span className="text-green-600 text-xl font-bold">✓ Correct</span>}
                            {isWrongSelection && <span className="text-red-600 text-xl font-bold">✗ Wrong</span>}
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
                disabled={submitting || !reading.questions.every((q: Question) => selectedAnswers[q.id]?.length > 0)}
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

      </main>

      {feedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
          <MessageBox type={feedback.type} message={feedback.message} />
        </div>
      )}

      <KidNav active="dashboard" />
    </div>
  )
}

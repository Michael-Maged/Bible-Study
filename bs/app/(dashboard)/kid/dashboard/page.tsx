'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getTodayReading, markReadingComplete } from './actions'
import { cacheReading, getCachedReading, isOnline } from '@/utils/offlineCache'
import OfflineBanner from '@/components/OfflineBanner'
import LoadingScreen from '@/components/LoadingScreen'
import type { TodayReading, QuizResults, Question, QuestionOption, CorrectAnswer, Attempt } from '@/types'
import KidNav from '@/components/KidNav'
import MessageBox from '@/components/MessageBox'
import PushSubscriber from '@/components/PushSubscriber'


export default function DashboardPage() {
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
    setLoading(true)

    if (!navigator.onLine) {
      const cached = getCachedReading()
      setReading(cached?.data || null)
      setLoading(false)
      return
    }

    try {
      const result = await getTodayReading()
      if (result.success) {
        
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
        setReading(null)
        cacheReading(null)
      }
    } catch {
      const cached = getCachedReading()
      setReading(cached?.data || null)
    }
    setLoading(false)
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
    } catch {
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

  if (!reading) return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen flex flex-col">
      <OfflineBanner />
      <div className="flex-1 flex items-center justify-center flex-col gap-4 px-5 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#1a2e12] border border-[#59f20d]/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#59f20d" strokeWidth={1.5} className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-2xl font-black">No Reading Today</h2>
        <p className="text-slate-500 text-sm">Check back later for today&apos;s assignment!</p>
      </div>
      <KidNav active="dashboard" />
    </div>
  )

  return (
    <div className="bg-[#0d1a08] text-slate-100 min-h-screen">
      <OfflineBanner />
      <PushSubscriber />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0d1a08]/90 backdrop-blur-xl border-b border-[#59f20d]/10 px-5 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#59f20d] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0d1a08" strokeWidth={2.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-black text-base tracking-tight">Bible Kids</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 pb-28 space-y-5">
        {/* Greeting */}
        <div>
          <h2 className="text-3xl font-black">Today&apos;s Reading</h2>
          <p className="text-slate-500 text-sm mt-1">Ready for your adventure with God?</p>
        </div>

        {/* Reading Card */}
        <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#59f20d]/10 flex items-center justify-between">
            <div>
              <p className="font-black text-lg">{reading.bookName}</p>
              <p className="text-[#59f20d] text-sm font-bold">{reading.reference}</p>
            </div>
            {reading.isCompleted && (
              <span className="text-xs font-black text-[#59f20d] bg-[#59f20d]/10 px-3 py-1 rounded-full">✓ Done</span>
            )}
          </div>
          <div className="p-5 space-y-3 text-lg leading-loose font-medium text-right" dir="rtl">
            {reading.text.map((verse: string, idx: number) => {
              const parts = verse.split(/(\d+)\s/)
              let cur: Array<{type: string; text: string}> = []
              const verses: Array<Array<{type: string; text: string}>> = []
              parts.forEach(part => {
                if (!part.trim()) return
                if (/^\d+$/.test(part)) { if (cur.length) { verses.push([...cur]); cur = [] } cur.push({ type: 'number', text: part }) }
                else cur.push({ type: 'text', text: part })
              })
              if (cur.length) verses.push(cur)
              return verses.map((vc, vi) => (
                <p key={`${idx}-${vi}`}>
                  {vc.map((item, ii) => item.type === 'number'
                    ? <span key={ii} className="text-[#59f20d] font-black text-sm ml-2">{item.text}</span>
                    : <span key={ii}>{item.text}</span>
                  )}
                </p>
              ))
            })}
          </div>
          {!reading.isCompleted && !reading.hasAttempted && (!reading.questions || reading.questions.length === 0) && (
            <div className="p-5 border-t border-[#59f20d]/10">
              <button
                onClick={handleMarkComplete} disabled={completing}
                className="w-full h-14 rounded-2xl bg-[#59f20d] text-[#0d1a08] font-black text-base shadow-xl shadow-[#59f20d]/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {completing ? 'Marking...' : 'Mark as Complete'}
              </button>
            </div>
          )}
          {reading.isCompleted && (
            <div className="p-5 border-t border-[#59f20d]/10 flex items-center justify-center gap-2 text-[#59f20d]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-black">Completed!</span>
            </div>
          )}
        </div>

        {/* Quiz */}
        {reading.questions && reading.questions.length > 0 && (
          <div className="bg-[#1a2e12] rounded-2xl border border-[#59f20d]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#59f20d]/10 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-[#59f20d] rounded-full" />
              <p className="font-black">Quiz Time</p>
            </div>
            <div className="p-5 space-y-5">
              {reading.questions.map((q: Question, idx: number) => {
                const isMultiple = (q.correctCount || 1) > 1
                return (
                  <div key={q.id}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-7 h-7 rounded-xl bg-[#59f20d] text-[#0d1a08] flex items-center justify-center font-black text-xs flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{q.question}</p>
                        {isMultiple && <p className="text-xs text-blue-400 mt-1">Select all correct answers</p>}
                      </div>
                      <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">{q.score}pts</span>
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt: QuestionOption) => {
                        const isSelected = selectedAnswers[q.id]?.includes(opt.id)
                        const isCorrectOpt = quizResults?.correctAnswers?.some((ca: CorrectAnswer) => ca.question === q.id && ca.correct_option === opt.id)
                        const isWrong = quizResults && isSelected && !isCorrectOpt
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleAnswer(q.id, opt.id, isMultiple)}
                            disabled={!!quizResults}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                              quizResults && isCorrectOpt ? 'bg-[#59f20d]/20 border-[#59f20d]/60 text-[#59f20d]' :
                              isWrong ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                              isSelected ? 'bg-[#59f20d]/10 border-[#59f20d]/40' :
                              'bg-[#0d1a08] border-[#59f20d]/10 hover:border-[#59f20d]/30'
                            } disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded${isMultiple ? '' : '-full'} border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-[#59f20d] bg-[#59f20d]' : 'border-slate-600'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-[#0d1a08] rounded-full" />}
                              </div>
                              <span className="flex-1">{opt.option}</span>
                              {quizResults && isCorrectOpt && <span className="text-xs font-black text-[#59f20d]">✓</span>}
                              {isWrong && <span className="text-xs font-black text-red-400">✗</span>}
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
                  className="w-full h-14 rounded-2xl bg-[#59f20d] text-[#0d1a08] font-black text-base shadow-xl shadow-[#59f20d]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Answers'}
                </button>
              )}
              {quizResults && (
                <div className="bg-[#59f20d]/10 border border-[#59f20d]/20 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-black text-[#59f20d] mb-1">{quizResults.totalScore}</p>
                  <p className="text-sm font-bold text-slate-400">points earned — great job!</p>
                </div>
              )}
            </div>
          </div>
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

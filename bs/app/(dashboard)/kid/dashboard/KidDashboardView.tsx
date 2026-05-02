'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BiblePassage from '@/components/kid/BiblePassage'
import QuizCard from '@/components/kid/QuizCard'
import OfflineBanner from '@/components/OfflineBanner'
import MessageBox from '@/components/MessageBox'
import KidNav from '@/components/KidNav'
import PushSubscriber from '@/components/PushSubscriber'
import { markReadingComplete } from './actions'
import { cacheReading, isOnline } from '@/utils/offlineCache'
import type { TodayReading, Question, CorrectAnswer, Attempt, QuizResults } from '@/types'

interface KidDashboardViewProps {
  initialReading: TodayReading | null
}

export default function KidDashboardView({ initialReading }: KidDashboardViewProps) {
  const [reading, setReading] = useState<TodayReading | null>(initialReading)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (initialReading) cacheReading(initialReading)

    if (initialReading?.hasAttempted && initialReading.attempts?.length) {
      const answersMap: Record<string, string[]> = {}
      initialReading.attempts.forEach((a: Attempt) => {
        if (!answersMap[a.question]) answersMap[a.question] = []
        answersMap[a.question].push(a.option)
      })
      setSelectedAnswers(answersMap)

      const results = initialReading.attempts.map((a: Attempt) => ({
        questionId: a.question,
        optionId: a.option,
        isCorrect: initialReading.correctAnswers?.some(
          (ca: CorrectAnswer) => ca.question === a.question && ca.correct_option === a.option
        ) ?? false,
      }))

      const answersByQ: Record<string, string[]> = {}
      initialReading.attempts.forEach((a: Attempt) => {
        if (!answersByQ[a.question]) answersByQ[a.question] = []
        answersByQ[a.question].push(a.option)
      })
      const correctByQ: Record<string, string[]> = {}
      initialReading.correctAnswers?.forEach((ca: CorrectAnswer) => {
        if (!correctByQ[ca.question]) correctByQ[ca.question] = []
        correctByQ[ca.question].push(ca.correct_option)
      })
      let totalScore = 0
      Object.keys(answersByQ).forEach((qId) => {
        const student = answersByQ[qId].sort()
        const correct = (correctByQ[qId] || []).sort()
        if (student.length === correct.length && student.every((a, i) => a === correct[i])) {
          const q = initialReading.questions?.find((q: Question) => q.id === qId)
          totalScore += q?.score || 0
        }
      })
      setQuizResults({ success: true, results, totalScore, correctAnswers: initialReading.correctAnswers })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleAnswer = (questionId: string, optionId: string, isMultiple: boolean) => {
    if (quizResults) return
    setSelectedAnswers((prev) => {
      const current = prev[questionId] || []
      if (isMultiple) {
        return { ...prev, [questionId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] }
      }
      return { ...prev, [questionId]: [optionId] }
    })
  }

  const handleSubmitQuiz = async () => {
    if (!reading?.questions?.length) return
    const allAnswered = reading.questions.every((q: Question) => selectedAnswers[q.id]?.length > 0)
    if (!allAnswered) { setFeedback({ type: 'error', message: 'Please answer all questions' }); return }
    const answers = Object.entries(selectedAnswers).flatMap(([qId, opts]) => opts.map((o) => ({ questionId: qId, optionId: o })))
    setSubmitting(true)
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: reading.userId, readingId: reading.readingId, answers }),
      })
      const result = await res.json()
      if (result.success) {
        setQuizResults(result)
        const mark = await markReadingComplete(reading.readingId, reading.userId)
        if (mark.success) setReading({ ...reading, isCompleted: true, hasAttempted: true })
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
      setReading({ ...reading, isCompleted: true })
      return
    }
    setCompleting(true)
    const result = await markReadingComplete(reading.readingId, reading.userId)
    if (result.success) {
      setReading({ ...reading, isCompleted: true })
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to mark complete' })
    }
    setCompleting(false)
  }

  const totalPoints = reading?.questions?.reduce((sum: number, q: Question) => sum + (q.score || 0), 0) ?? 0

  if (!reading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <OfflineBanner />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon0.svg" alt="" width={44} height={44} />
            </div>
            <h2 className="text-xl font-bold text-foreground">No Reading Today</h2>
            <p className="text-muted-foreground text-sm">Check back later for your next assignment.</p>
          </div>
        </div>
        <KidNav active="dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />
      <PushSubscriber />

      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-4">

        {/* Page header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Peace,</p>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Today&apos;s Reading</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent border border-border flex items-center justify-center flex-shrink-0 mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon0.svg" alt="" width={28} height={28} />
          </div>
        </div>

        {/* Today's reading hero card */}
        <div
          className="rounded-2xl border border-border p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #f7ecd3 0%, #f7f1e6 70%)' }}
        >
          <div className="absolute top-[-16px] right-[-14px] opacity-20 pointer-events-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon0.svg" alt="" width={110} height={110} />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#8a5a0f]">
            Today&apos;s reading
          </p>
          <h2 className="text-[22px] font-bold tracking-tight text-foreground mt-2 max-w-[220px] leading-snug">
            {reading.bookName}
          </h2>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            {reading.reference}
          </p>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              ~5 min read
            </div>
            {totalPoints > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8a5a0f]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1l1.5 3L11 4.5 8.5 7l.7 3.5L6 9l-3.2 1.5.7-3.5L1 4.5 4.5 4 6 1z"/>
                </svg>
                +{totalPoints} pts
              </div>
            )}
            {reading.isCompleted && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5a7a3a]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Complete
              </div>
            )}
          </div>
        </div>

        {/* Bible Passage */}
        <BiblePassage verses={reading.text} />

        {/* Mark complete (no quiz) */}
        {!reading.isCompleted && !reading.hasAttempted && !reading.questions?.length && (
          <Button
            onClick={handleMarkComplete}
            disabled={completing}
            className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]"
          >
            {completing ? <><Loader2 size={16} className="mr-2 animate-spin" />Marking…</> : 'Mark as Complete'}
          </Button>
        )}

        {/* Completed, no quiz */}
        {reading.isCompleted && !reading.questions?.length && (
          <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: 'rgba(90,122,58,0.08)', borderColor: 'rgba(90,122,58,0.25)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#5a7a3a', flexShrink: 0 }}>
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold" style={{ color: '#5a7a3a' }}>Reading Complete!</span>
          </div>
        )}

        {/* Quiz section */}
        {reading.questions?.length > 0 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-foreground">Quick check</span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {reading.questions.length} question{reading.questions.length !== 1 ? 's' : ''} · {totalPoints} pts
                </span>
              </div>
            </div>

            {reading.questions.map((q: Question, idx: number) => (
              <QuizCard
                key={q.id}
                question={{ ...q, correctCount: q.correctCount ?? 0 }}
                index={idx + 1}
                selectedAnswers={selectedAnswers[q.id] || []}
                quizResult={quizResults}
                onToggle={toggleAnswer}
                disabled={submitting}
              />
            ))}

            {!quizResults ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={submitting || !reading.questions.every((q: Question) => selectedAnswers[q.id]?.length > 0)}
                className="w-full h-11 font-bold shadow-[0_2px_0_rgba(138,90,15,0.25)]"
              >
                {submitting ? <><Loader2 size={16} className="mr-2 animate-spin" />Submitting…</> : 'Submit Answers'}
              </Button>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-2">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-accent-foreground">
                    <path d="M11 2l2.2 4.6L18 7.6l-3.5 3.4.8 4.8L11 13.5l-4.3 2.3.8-4.8L4 7.6l4.8-.9L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4 className="text-base font-bold text-foreground">Brilliant work!</h4>
                <p className="text-sm font-bold text-primary">You earned {quizResults.totalScore} points!</p>
              </div>
            )}
          </div>
        )}

      </main>

      {feedback && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
          <MessageBox type={feedback.type} message={feedback.message} />
        </div>
      )}

      <KidNav active="dashboard" />
    </div>
  )
}

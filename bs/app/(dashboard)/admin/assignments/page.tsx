'use client'

import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import type { QuestionBuilder, QuestionOptionBuilder } from '@/types'
import { bibleBooks } from '@/constants/bibleBooks'
import MessageBox from '@/components/MessageBox'
import { Button } from '@/components/ui/button'

export default function AssignmentsPage() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [bookId, setBookId] = useState('')
  const [chapter, setChapter] = useState('')
  const [verseFrom, setVerseFrom] = useState('')
  const [verseTo, setVerseTo] = useState('')
  const [versePreview, setVersePreview] = useState<string[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [maxChapter, setMaxChapter] = useState<number | null>(null)
  const [maxVerse, setMaxVerse] = useState<number | null>(null)
  const [chapterError, setChapterError] = useState('')
  const [verseError, setVerseError] = useState('')
  const [userGrade, setUserGrade] = useState<number | null>(null)
  const [userTenant, setUserTenant] = useState<string | null>(null)
  const [isWholeTenant, setIsWholeTenant] = useState(false)
  const [questions, setQuestions] = useState<QuestionBuilder[]>([{ question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(now)
    fetchUserData()
  }, [])

  const changeMonth = (direction: number) => {
    if (!currentDate) return
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    const days = []
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, isCurrentMonth: true })
    return days
  }

  const fetchUserData = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase.from('user').select('*, admin(*)').eq('auth_id', user.id).single()
        if (userData?.admin?.[0]) {
          setUserGrade(userData.admin[0].grade)
          setUserTenant(userData.admin[0].tenant)
        }
      }
    } catch {}
  }

  // Fetch max chapters when book changes
  useEffect(() => {
    if (!bookId) { setMaxChapter(null); setMaxVerse(null); return }
    fetch(`/api/bible?book=${bookId}`)
      .then(r => r.json())
      .then(d => setMaxChapter(d.chapters ?? null))
      .catch(() => {})
  }, [bookId])

  // Fetch max verses when chapter changes
  useEffect(() => {
    if (!bookId || !chapter) { setMaxVerse(null); return }
    const ch = parseInt(chapter)
    if (!ch || (maxChapter && ch > maxChapter)) { setMaxVerse(null); return }
    fetch(`/api/bible?book=${bookId}&ch=${chapter}`)
      .then(r => r.json())
      .then(d => setMaxVerse(d.verses_count ?? null))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapter])

  const validateChapter = (val: string) => {
    const n = parseInt(val)
    if (!val) { setChapterError(''); return }
    if (isNaN(n) || n < 1) { setChapterError('Must be at least 1'); return }
    if (maxChapter && n > maxChapter) { setChapterError(`Max chapter is ${maxChapter}`); return }
    setChapterError('')
  }

  const validateVerses = (from: string, to: string) => {
    const f = parseInt(from), t = parseInt(to)
    if (!from && !to) { setVerseError(''); return }
    if (from && (isNaN(f) || f < 1)) { setVerseError('From must be at least 1'); return }
    if (to && (isNaN(t) || t < 1)) { setVerseError('To must be at least 1'); return }
    if (maxVerse) {
      if (from && f > maxVerse) { setVerseError(`Max verse is ${maxVerse}`); return }
      if (to && t > maxVerse) { setVerseError(`Max verse is ${maxVerse}`); return }
    }
    if (from && to && f > t) { setVerseError('From must be ≤ To'); return }
    setVerseError('')
  }

  const fetchFullChapter = async () => {
    if (!bookId || !chapter) return
    if (maxVerse) { setVerseFrom('1'); setVerseTo(maxVerse.toString()); setVerseError(''); return }
    const res = await fetch(`/api/bible?book=${bookId}&ch=${chapter}`)
    const data = await res.json()
    if (data.verses_count) { setVerseFrom('1'); setVerseTo(data.verses_count.toString()); setVerseError('') }
  }

  const loadPreview = async () => {
    if (!bookId || !chapter) return
    setIsLoadingPreview(true)
    try {
      let url = `/api/bible?book=${bookId}&ch=${chapter}`
      if (verseFrom && verseTo) url += `&ver=${verseFrom}:${verseTo}`
      else if (verseFrom) url += `&ver=${verseFrom}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.arr) setVersePreview(data.arr)
      else if (data.text) setVersePreview([data.text])
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const saveReading = async () => {
    if (chapterError || verseError) {
      setFeedback({ type: 'error', message: 'Fix validation errors before publishing' }); return
    }
    if (!bookId || !chapter || !verseFrom || !verseTo || !selectedDate) {
      setFeedback({ type: 'error', message: 'Please fill all fields' }); return
    }
    if (!userGrade || !userTenant) {
      setFeedback({ type: 'error', message: 'User data not loaded' }); return
    }
    const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    try {
      const res = await fetch('/api/bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: parseInt(bookId), chapter: parseInt(chapter),
          from_verse: parseInt(verseFrom), to_verse: parseInt(verseTo),
          day: dateString, grade: isWholeTenant ? null : userGrade, tenant: userTenant
        })
      })
      const result = await res.json()
      if (result.success) {
        const readingId = result.data[0].id
        for (const q of questions) {
          if (!q.question.trim() || q.options.length < 2 || !q.options.some((o: QuestionOptionBuilder) => o.isCorrect) || q.options.some((o: QuestionOptionBuilder) => !o.text.trim())) continue
          await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reading: readingId, question: q.question, score: q.score, options: q.options }) })
        }
        setFeedback({ type: 'success', message: 'Reading published!' })
        setQuestions([{ question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
        setVersePreview([]); setBookId(''); setChapter('')
      } else {
        setFeedback({ type: 'error', message: 'Error saving reading' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error saving reading' })
    }
  }

  const addQuestion = () => setQuestions([...questions, { question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, field: string, value: string | number) => {
    const u = [...questions] as QuestionBuilder[]
    ;(u[i] as Record<string, string | number | QuestionOptionBuilder[]>)[field] = value
    setQuestions(u)
  }
  const addOption = (qi: number) => { const u = [...questions]; u[qi].options.push({ text: '', isCorrect: false }); setQuestions(u) }
  const updateOption = (qi: number, oi: number, field: string, value: string | boolean) => {
    const u = [...questions] as QuestionBuilder[]
    ;(u[qi].options[oi] as Record<string, string | boolean>)[field] = value
    setQuestions(u)
  }
  const setCorrectAnswer = (qi: number, oi: number) => { const u = [...questions]; u[qi].options[oi].isCorrect = !u[qi].options[oi].isCorrect; setQuestions(u) }

  const inputClass = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground'

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="px-5 pt-6 pb-5 space-y-5 max-w-lg mx-auto">

        {/* Page header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Config</p>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Assign Reading</h1>
          </div>
          <Button onClick={saveReading} className="shadow-[0_2px_0_rgba(138,90,15,0.25)] mt-1" size="sm">
            Publish
          </Button>
        </div>

        {/* Schedule */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Schedule</p>
          {!currentDate ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent/30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <p className="font-bold text-sm">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent/30 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center gap-y-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="text-[10px] font-bold text-muted-foreground uppercase">{d}</span>
                ))}
                {getDaysInMonth(currentDate).map((item, i) => {
                  const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day)
                  const isSelected = selectedDate?.toDateString() === dateObj.toDateString()
                  return (
                    <button key={i} onClick={() => item.isCurrentMonth && setSelectedDate(dateObj)} disabled={!item.isCurrentMonth}
                      className="h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium rounded-full transition-colors"
                      style={
                        isSelected
                          ? { background: '#c2851b', color: '#fff', fontWeight: 700 }
                          : !item.isCurrentMonth
                          ? { color: 'var(--muted-foreground)', opacity: 0.3, cursor: 'not-allowed' }
                          : { color: 'var(--foreground)' }
                      }
                    >
                      {item.day}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Passage */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Passage</p>

          <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
            style={{ background: 'rgba(194,133,27,0.06)', borderColor: 'rgba(194,133,27,0.25)' }}
          >
            <input type="checkbox" checked={isWholeTenant} onChange={(e) => setIsWholeTenant(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-semibold" style={{ color: '#c2851b' }}>Assign to Whole Tenant</span>
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bible Book</label>
            <select value={bookId} onChange={(e) => { setBookId(e.target.value); setChapter(''); setVerseFrom(''); setVerseTo(''); setChapterError(''); setVerseError('') }} className={inputClass}>
              <option value="">Select Book</option>
              {bibleBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chapter</label>
              <input
                type="number"
                min="1"
                value={chapter}
                onChange={(e) => { setChapter(e.target.value); setVerseFrom(''); setVerseTo(''); setVerseError(''); validateChapter(e.target.value) }}
                onBlur={(e) => validateChapter(e.target.value)}
                placeholder={maxChapter ? `1–${maxChapter}` : 'e.g. 3'}
                disabled={!bookId}
                className={`${inputClass} ${chapterError ? 'border-destructive focus:ring-destructive/30' : ''}`}
              />
              {chapterError && <p className="text-xs text-destructive font-semibold">{chapterError}</p>}
              {!chapterError && maxChapter && <p className="text-xs text-muted-foreground">{maxChapter} chapters</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verses</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={verseFrom}
                  onChange={(e) => { setVerseFrom(e.target.value); validateVerses(e.target.value, verseTo) }}
                  onBlur={(e) => validateVerses(e.target.value, verseTo)}
                  placeholder="From"
                  disabled={!chapter || !!chapterError}
                  className={`${inputClass} ${verseError ? 'border-destructive focus:ring-destructive/30' : ''}`}
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  min="1"
                  value={verseTo}
                  onChange={(e) => { setVerseTo(e.target.value); validateVerses(verseFrom, e.target.value) }}
                  onBlur={(e) => validateVerses(verseFrom, e.target.value)}
                  placeholder="To"
                  disabled={!chapter || !!chapterError}
                  className={`${inputClass} ${verseError ? 'border-destructive focus:ring-destructive/30' : ''}`}
                />
              </div>
              {verseError && <p className="text-xs text-destructive font-semibold">{verseError}</p>}
              {!verseError && maxVerse && <p className="text-xs text-muted-foreground">{maxVerse} verses</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={fetchFullChapter} disabled={!bookId || !chapter}>
              Full Chapter
            </Button>
            <Button size="sm" className="flex-1 shadow-[0_2px_0_rgba(138,90,15,0.25)]" onClick={loadPreview} disabled={!bookId || !chapter || isLoadingPreview || !!chapterError || !!verseError}>
              {isLoadingPreview ? <Loader2 size={14} className="animate-spin" /> : <><Eye size={14} className="mr-1" />Preview</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setVerseFrom(''); setVerseTo(''); setVersePreview([]) }}>Clear</Button>
          </div>
        </div>

        {/* Preview */}
        {versePreview.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Preview</p>
            <div className="space-y-2 max-h-72 overflow-y-auto" dir="rtl">
              {versePreview.map((verse, i) => (
                <div key={i} className="p-3 rounded-xl bg-accent/40 text-sm leading-relaxed font-[family-name:var(--font-arabic)]">{verse}</div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Daily Quiz</p>
            <button
              onClick={addQuestion}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent/30 transition-colors"
            >
              <Plus size={12} />New Question
            </button>
          </div>

          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-2xl border bg-card p-4 space-y-3"
              style={{ borderColor: 'rgba(194,133,27,0.35)', borderLeftWidth: 4, borderLeftColor: '#c2851b' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}>
                  Question {qi + 1}
                </span>
                <button onClick={() => removeQuestion(qi)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={q.question}
                onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
                placeholder="Enter question…"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-muted-foreground">Score</label>
                <input
                  type="number"
                  value={q.score}
                  onChange={(e) => updateQuestion(qi, 'score', parseInt(e.target.value))}
                  className="w-20 h-8 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">Options (tap ✓ to mark correct)</p>
                {q.options.map((opt: QuestionOptionBuilder, oi: number) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      value={opt.text}
                      onChange={(e) => updateOption(qi, oi, 'text', e.target.value)}
                      className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                      type="text"
                      placeholder={`Option ${oi + 1}`}
                    />
                    <button
                      onClick={() => setCorrectAnswer(qi, oi)}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                      style={
                        opt.isCorrect
                          ? { borderColor: '#c2851b', background: '#c2851b', color: '#fff' }
                          : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                      }
                    >
                      {opt.isCorrect ? <Check size={12} /> : <span className="text-xs">○</span>}
                    </button>
                  </div>
                ))}
                {q.options.length < 4 && (
                  <button
                    onClick={() => addOption(qi)}
                    className="w-full py-2 border-2 border-dashed border-border rounded-xl text-muted-foreground text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          ))}

          {feedback && <MessageBox type={feedback.type} message={feedback.message} />}
        </div>
      </main>

      <AdminNav active="assignments" />
    </div>
  )
}

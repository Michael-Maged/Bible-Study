'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Plus, Trash2, Check } from 'lucide-react'
import { getFutureReadings, updateReading, deleteReading } from './actions'
import { cacheAdminHistory, getCachedAdminHistory, isOnline } from '@/utils/offlineCache'
import type { AdminReading, QuestionBuilder, QuestionOptionBuilder } from '@/types'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import { bibleBooks } from '@/constants/bibleBooks'
import MessageBox from '@/components/MessageBox'
import { Button } from '@/components/ui/button'

type ExistingQuestion = {
  id: string
  question: string
  score: number
  options: { id: string; option: string }[]
  correctanswers: { correct_option: string }[]
}

type EditableQuestion = {
  id: string
  question: string
  score: number
  options: { text: string; isCorrect: boolean }[]
}

export default function HistoryPage() {
  const [readings, setReadings] = useState<AdminReading[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ day: '', book: 0, chapter: 0, from_verse: 0, to_verse: 0 })
  const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>([])
  const [newQuestions, setNewQuestions] = useState<QuestionBuilder[]>([])
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([])
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadReadings = async () => {
    if (!isOnline()) {
      const cached = getCachedAdminHistory()
      if (cached) { setReadings(cached); setLoading(false); return }
    }
    setLoading(true)
    const result = await getFutureReadings()
    if (result.success && result.data) {
      setReadings(result.data)
      cacheAdminHistory(result.data)
    }
    setLoading(false)
  }

  useEffect(() => { loadReadings() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = async (reading: AdminReading) => {
    setLoadingEdit(true)
    setEditingId(reading.id)
    setEditForm({ day: reading.day, book: reading.book, chapter: reading.chapter, from_verse: reading.from_verse, to_verse: reading.to_verse })
    setNewQuestions([])
    setDeletedQuestionIds([])
    const res = await fetch(`/api/questions?reading=${reading.id}`)
    const data = await res.json()
    if (data.success) {
      setEditableQuestions(data.data.map((q: ExistingQuestion) => ({
        id: q.id,
        question: q.question,
        score: q.score,
        options: q.options.map((opt: { id: string; option: string }) => ({
          text: opt.option,
          isCorrect: q.correctanswers.some(ca => ca.correct_option === opt.id)
        }))
      })))
    } else {
      setEditableQuestions([])
    }
    setLoadingEdit(false)
  }

  const handleSave = async (readingId: string) => {
    // Save passage edits
    const result = await updateReading(readingId, editForm)
    if (!result.success) { setFeedback({ type: 'error', message: result.error || 'Failed to update' }); return }

    // Update existing questions
    for (const q of editableQuestions.filter(q => !deletedQuestionIds.includes(q.id))) {
      await fetch('/api/questions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: q.id, question: q.question, score: q.score, options: q.options }) })
    }

    // Delete removed questions
    for (const qId of deletedQuestionIds) {
      await fetch('/api/questions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: qId }) })
    }

    // Add new questions
    for (const q of newQuestions) {
      if (!q.question.trim() || q.options.length < 2 || !q.options.some((o) => o.isCorrect) || q.options.some((o) => !o.text.trim())) continue
      await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reading: readingId, question: q.question, score: q.score, options: q.options }) })
    }

    setEditingId(null)
    setFeedback({ type: 'success', message: 'Reading updated!' })
    setTimeout(() => setFeedback(null), 3000)
    loadReadings()
  }

  const handleDelete = async (readingId: string) => {
    if (!confirm('Delete this reading?')) return
    const result = await deleteReading(readingId)
    if (result.success) loadReadings()
    else setFeedback({ type: 'error', message: result.error || 'Failed to delete' })
  }

  // Existing question helpers
  const updateExistingQuestion = (i: number, field: string, value: string | number) => {
    const u = [...editableQuestions]
    ;(u[i] as Record<string, string | number | { text: string; isCorrect: boolean }[]>)[field] = value
    setEditableQuestions(u)
  }
  const updateExistingOption = (qi: number, oi: number, value: string) => {
    const u = [...editableQuestions]
    u[qi].options[oi].text = value
    setEditableQuestions(u)
  }
  const toggleExistingCorrect = (qi: number, oi: number) => {
    const u = [...editableQuestions]
    u[qi].options[oi].isCorrect = !u[qi].options[oi].isCorrect
    setEditableQuestions(u)
  }

  // New question helpers
  const addNewQuestion = () => setNewQuestions([...newQuestions, { question: '', score: 10, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }])
  const removeNewQuestion = (i: number) => setNewQuestions(newQuestions.filter((_, idx) => idx !== i))
  const updateNewQuestion = (i: number, field: string, value: string | number) => {
    const u = [...newQuestions] as QuestionBuilder[]
    ;(u[i] as Record<string, string | number | QuestionOptionBuilder[]>)[field] = value
    setNewQuestions(u)
  }
  const addNewOption = (qi: number) => { const u = [...newQuestions]; u[qi].options.push({ text: '', isCorrect: false }); setNewQuestions(u) }
  const updateNewOption = (qi: number, oi: number, field: string, value: string | boolean) => {
    const u = [...newQuestions] as QuestionBuilder[]
    ;(u[qi].options[oi] as Record<string, string | boolean>)[field] = value
    setNewQuestions(u)
  }
  const toggleNewCorrect = (qi: number, oi: number) => { const u = [...newQuestions]; u[qi].options[oi].isCorrect = !u[qi].options[oi].isCorrect; setNewQuestions(u) }

  const getBookName = (bookId: number) => bibleBooks.find(b => b.id === bookId)?.name || `Book ${bookId}`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const inputClass = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="px-5 py-6 space-y-4 max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Schedule</p>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-1">Reading History</h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem('admin_history_cache'); loadReadings() }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : readings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mx-auto opacity-30">
              <rect x="6" y="4" width="24" height="28" rx="3" stroke="currentColor" strokeWidth="2.2"/>
              <path d="M12 13h12M12 18h12M12 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="font-bold">No Future Readings</p>
            <p className="text-sm text-muted-foreground">No readings have been scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {readings.map((reading) => (
              <div key={reading.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                {editingId === reading.id ? (
                  loadingEdit ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">

                      {/* Passage fields */}
                      <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Passage</p>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                        <input type="date" value={editForm.day} onChange={(e) => setEditForm({ ...editForm, day: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Book</label>
                        <select value={editForm.book} onChange={(e) => setEditForm({ ...editForm, book: parseInt(e.target.value), chapter: 0, from_verse: 0, to_verse: 0 })} className={inputClass}>
                          {bibleBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Chapter</label>
                          <input type="number" min="1" value={editForm.chapter || ''} onChange={(e) => setEditForm({ ...editForm, chapter: parseInt(e.target.value) || 0, from_verse: 0, to_verse: 0 })} placeholder="e.g. 3" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Verses</label>
                          <div className="flex items-center gap-1">
                            <input type="number" min="1" value={editForm.from_verse || ''} onChange={(e) => setEditForm({ ...editForm, from_verse: parseInt(e.target.value) || 0 })} placeholder="From" className={inputClass} />
                            <span className="text-muted-foreground">–</span>
                            <input type="number" min="1" value={editForm.to_verse || ''} onChange={(e) => setEditForm({ ...editForm, to_verse: parseInt(e.target.value) || 0 })} placeholder="To" className={inputClass} />
                          </div>
                        </div>
                      </div>

                      {/* Existing questions */}
                      {editableQuestions.filter(q => !deletedQuestionIds.includes(q.id)).length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Existing Questions</p>
                          {editableQuestions.map((q, qi) => deletedQuestionIds.includes(q.id) ? null : (
                            <div key={q.id} className="rounded-xl border bg-background p-3 space-y-2" style={{ borderColor: 'rgba(194,133,27,0.35)', borderLeftWidth: 3, borderLeftColor: '#c2851b' }}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold" style={{ color: '#c2851b' }}>Q{qi + 1}</span>
                                <button onClick={() => setDeletedQuestionIds([...deletedQuestionIds, q.id])} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <textarea
                                value={q.question}
                                onChange={(e) => updateExistingQuestion(qi, 'question', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
                                placeholder="Enter question…"
                                rows={2}
                              />
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-muted-foreground">Score</label>
                                <input type="number" value={q.score} onChange={(e) => updateExistingQuestion(qi, 'score', parseInt(e.target.value))} className="w-16 h-8 px-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" min="1" />
                              </div>
                              <div className="space-y-1.5">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <input value={opt.text} onChange={(e) => updateExistingOption(qi, oi, e.target.value)} className="flex-1 h-8 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" type="text" placeholder={`Option ${oi + 1}`} />
                                    <button onClick={() => toggleExistingCorrect(qi, oi)} className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                                      style={opt.isCorrect ? { borderColor: '#c2851b', background: '#c2851b', color: '#fff' } : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                                      {opt.isCorrect ? <Check size={11} /> : <span className="text-xs">○</span>}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New questions */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">Add Questions</p>
                          <button onClick={addNewQuestion} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent/30 transition-colors">
                            <Plus size={11} />New
                          </button>
                        </div>
                        {newQuestions.map((q, qi) => (
                          <div key={qi} className="rounded-xl border bg-background p-3 space-y-2" style={{ borderColor: 'rgba(194,133,27,0.35)', borderLeftWidth: 3, borderLeftColor: '#c2851b' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold" style={{ color: '#c2851b' }}>New Q{qi + 1}</span>
                              <button onClick={() => removeNewQuestion(qi)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                            </div>
                            <textarea
                              value={q.question}
                              onChange={(e) => updateNewQuestion(qi, 'question', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
                              placeholder="Enter question…"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-muted-foreground">Score</label>
                              <input type="number" value={q.score} onChange={(e) => updateNewQuestion(qi, 'score', parseInt(e.target.value))} className="w-16 h-8 px-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" min="1" />
                            </div>
                            <div className="space-y-1.5">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input value={opt.text} onChange={(e) => updateNewOption(qi, oi, 'text', e.target.value)} className="flex-1 h-8 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" type="text" placeholder={`Option ${oi + 1}`} />
                                  <button onClick={() => toggleNewCorrect(qi, oi)} className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                                    style={opt.isCorrect ? { borderColor: '#c2851b', background: '#c2851b', color: '#fff' } : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                                    {opt.isCorrect ? <Check size={11} /> : <span className="text-xs">○</span>}
                                  </button>
                                </div>
                              ))}
                              {q.options.length < 4 && (
                                <button onClick={() => addNewOption(qi)} className="w-full py-1.5 border-2 border-dashed border-border rounded-xl text-muted-foreground text-xs font-bold hover:border-primary hover:text-primary transition-colors">
                                  + Add Option
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button className="flex-1 shadow-[0_2px_0_rgba(138,90,15,0.25)]" size="sm" onClick={() => handleSave(reading.id)}>Save</Button>
                        <Button variant="outline" className="flex-1" size="sm" onClick={() => { setEditingId(null) }}>Cancel</Button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <rect x="1" y="1.5" width="8" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M3 1v1.5M7 1v1.5M1 4h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {formatDate(reading.day)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--primary)', flexShrink: 0 }}>
                          <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        <h3 className="font-bold text-sm truncate">{getBookName(reading.book)}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">Ch {reading.chapter}, v{reading.from_verse}–{reading.to_verse}</p>
                      <div className="pl-5">
                        {reading.grade ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-border bg-card text-foreground">
                            Grade {typeof reading.grade === 'object' ? reading.grade.grade_num : reading.grade}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}>
                            Whole Tenant
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleEdit(reading)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-border hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(reading.id)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-border hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2 3.5h9M4.5 3.5V2.5h4v1M5.5 6v3.5M7.5 6v3.5M3 3.5l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {feedback && <MessageBox type={feedback.type} message={feedback.message} />}
      </main>

      <AdminNav active="history" />
    </div>
  )
}

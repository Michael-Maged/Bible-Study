'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { getFutureReadings, updateReading, deleteReading } from './actions'
import { cacheAdminHistory, getCachedAdminHistory, isOnline } from '@/utils/offlineCache'
import type { AdminReading, BibleBookInfo, BibleChapterInfo } from '@/types'
import AdminNav from '@/components/AdminNav'
import OfflineBanner from '@/components/OfflineBanner'
import { bibleBooks } from '@/constants/bibleBooks'
import MessageBox from '@/components/MessageBox'
import { Button } from '@/components/ui/button'

export default function HistoryPage() {
  const [readings, setReadings] = useState<AdminReading[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ day: '', book: 0, chapter: 0, from_verse: 0, to_verse: 0 })
  const [bookInfo, setBookInfo] = useState<BibleBookInfo | null>(null)
  const [chapterInfo, setChapterInfo] = useState<BibleChapterInfo | null>(null)
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReadings() }, [])

  const handleEdit = async (reading: AdminReading) => {
    setEditingId(reading.id)
    setEditForm({ day: reading.day, book: reading.book, chapter: reading.chapter, from_verse: reading.from_verse, to_verse: reading.to_verse })
    const [bookRes, chapterRes] = await Promise.all([fetch(`/api/bible?book=${reading.book}`), fetch(`/api/bible?book=${reading.book}&ch=${reading.chapter}`)])
    setBookInfo(await bookRes.json())
    setChapterInfo(await chapterRes.json())
  }

  const handleSave = async (readingId: string) => {
    const result = await updateReading(readingId, editForm)
    if (result.success) { setEditingId(null); loadReadings() }
    else setFeedback({ type: 'error', message: result.error || 'Failed to update' })
  }

  const handleDelete = async (readingId: string) => {
    if (!confirm('Delete this reading?')) return
    const result = await deleteReading(readingId)
    if (result.success) loadReadings()
    else setFeedback({ type: 'error', message: result.error || 'Failed to delete' })
  }

  const getBookName = (bookId: number) => bibleBooks.find(b => b.id === bookId)?.name || `Book ${bookId}`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const inputClass = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <OfflineBanner />

      <main className="px-5 py-6 space-y-4 max-w-lg mx-auto">

        {/* Page header */}
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
                  !bookInfo || !chapterInfo ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                        <input type="date" value={editForm.day} onChange={(e) => setEditForm({ ...editForm, day: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Book</label>
                        <select value={editForm.book} onChange={async (e) => {
                          const b = parseInt(e.target.value)
                          setEditForm({ ...editForm, book: b, chapter: 0, from_verse: 0, to_verse: 0 })
                          setChapterInfo(null)
                          if (b) { const res = await fetch(`/api/bible?book=${b}`); setBookInfo(await res.json()) }
                        }} className={inputClass}>
                          {bibleBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Chapter</label>
                          <select value={editForm.chapter} onChange={async (e) => {
                            const ch = parseInt(e.target.value)
                            setEditForm({ ...editForm, chapter: ch, from_verse: 0, to_verse: 0 })
                            if (ch) { const res = await fetch(`/api/bible?book=${editForm.book}&ch=${ch}`); setChapterInfo(await res.json()) }
                          }} className={inputClass}>
                            <option value="0">Select</option>
                            {Array.from({ length: bookInfo.chapters }, (_, i) => i + 1).map(ch => <option key={ch} value={ch}>{ch}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Verses</label>
                          <div className="flex items-center gap-1">
                            <select value={editForm.from_verse} onChange={(e) => setEditForm({ ...editForm, from_verse: parseInt(e.target.value) })} className={inputClass}>
                              <option value="0">From</option>
                              {Array.from({ length: chapterInfo.verses_count }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <span className="text-muted-foreground">–</span>
                            <select value={editForm.to_verse} onChange={(e) => setEditForm({ ...editForm, to_verse: parseInt(e.target.value) })} className={inputClass}>
                              <option value="0">To</option>
                              {Array.from({ length: chapterInfo.verses_count }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 shadow-[0_2px_0_rgba(138,90,15,0.25)]" size="sm" onClick={() => handleSave(reading.id)}>Save</Button>
                        <Button variant="outline" className="flex-1" size="sm" onClick={() => { setEditingId(null); setBookInfo(null); setChapterInfo(null) }}>Cancel</Button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Date badge */}
                      <div
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}
                      >
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
                      <p className="text-xs text-muted-foreground pl-5">
                        Ch {reading.chapter}, v{reading.from_verse}–{reading.to_verse}
                      </p>
                      <div className="pl-5">
                        {reading.grade ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-border bg-card text-foreground">
                            Grade {typeof reading.grade === 'object' ? reading.grade.grade_num : reading.grade}
                          </span>
                        ) : (
                          <span
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(194,133,27,0.10)', color: '#c2851b' }}
                          >
                            Whole Tenant
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(reading)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-border hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(reading.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-border hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
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

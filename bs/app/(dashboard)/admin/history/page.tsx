'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getFutureReadings, updateReading, deleteReading } from './actions'
import { cacheAdminHistory, getCachedAdminHistory, isOnline } from '@/utils/offlineCache'
import type { AdminReading, BibleBookInfo, BibleChapterInfo } from '@/types'
import AdminNav from '@/components/AdminNav'
import { bibleBooks } from '@/constants/bibleBooks'

export default function HistoryPage() {
  const router = useRouter()
  const [readings, setReadings] = useState<AdminReading[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ day: '', book: 0, chapter: 0, from_verse: 0, to_verse: 0 })
  const [bookInfo, setBookInfo] = useState<BibleBookInfo | null>(null)
  const [chapterInfo, setChapterInfo] = useState<BibleChapterInfo | null>(null)

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
      setCurrentUserId(result.currentUserId)
      cacheAdminHistory(result.data)
    } else {
      console.error('Failed to load readings:', result.error)
    }
    setLoading(false)
  }

  const handleEdit = async (reading: AdminReading) => {
    setEditingId(reading.id)
    setEditForm({
      day: reading.day,
      book: reading.book,
      chapter: reading.chapter,
      from_verse: reading.from_verse,
      to_verse: reading.to_verse
    })
    
    const [bookRes, chapterRes] = await Promise.all([
      fetch(`/api/bible?book=${reading.book}`),
      fetch(`/api/bible?book=${reading.book}&ch=${reading.chapter}`)
    ])
    setBookInfo(await bookRes.json())
    setChapterInfo(await chapterRes.json())
  }

  const handleSave = async (readingId: string) => {
    const result = await updateReading(readingId, editForm)
    if (result.success) {
      setEditingId(null)
      loadReadings()
    } else {
      alert(result.error || 'Failed to update')
    }
  }

  const handleDelete = async (readingId: string) => {
    if (!confirm('Delete this reading?')) return
    const result = await deleteReading(readingId)
    if (result.success) {
      loadReadings()
    } else {
      alert(result.error || 'Failed to delete')
    }
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
        <button onClick={() => { localStorage.removeItem('admin_history_cache'); loadReadings(); }} className="text-xs text-zinc-500 hover:text-[#59f20d]">🔄</button>
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
              {editingId === reading.id ? (
                !bookInfo || !chapterInfo ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-[#59f20d] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Date</label>
                    <input type="date" value={editForm.day} onChange={(e) => setEditForm({...editForm, day: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Bible Book</label>
                    <select value={editForm.book} onChange={async (e) => {
                      const newBook = parseInt(e.target.value)
                      setEditForm({...editForm, book: newBook, chapter: 0, from_verse: 0, to_verse: 0})
                      setChapterInfo(null)
                      if (newBook) {
                        const res = await fetch(`/api/bible?book=${newBook}`)
                        setBookInfo(await res.json())
                      }
                    }} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]">
                      {bibleBooks.map(book => (
                        <option key={book.id} value={book.id}>{book.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Chapter</label>
                      <select value={editForm.chapter} onChange={async (e) => {
                        const newCh = parseInt(e.target.value)
                        setEditForm({...editForm, chapter: newCh, from_verse: 0, to_verse: 0})
                        if (newCh) {
                          const res = await fetch(`/api/bible?book=${editForm.book}&ch=${newCh}`)
                          setChapterInfo(await res.json())
                        }
                      }} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]">
                        <option value="0">Select</option>
                        {Array.from({ length: bookInfo.chapters }, (_, i) => i + 1).map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Verses</label>
                      <div className="flex items-center gap-2">
                        <select value={editForm.from_verse} onChange={(e) => setEditForm({...editForm, from_verse: parseInt(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]">
                          <option value="0">From</option>
                          {Array.from({ length: chapterInfo.verses_count }, (_, i) => i + 1).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                        <span className="text-zinc-400">-</span>
                        <select value={editForm.to_verse} onChange={(e) => setEditForm({...editForm, to_verse: parseInt(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]">
                          <option value="0">To</option>
                          {Array.from({ length: chapterInfo.verses_count }, (_, i) => i + 1).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(reading.id)} className="flex-1 bg-[#59f20d] text-black px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform">Save</button>
                    <button onClick={() => { setEditingId(null); setBookInfo(null); setChapterInfo(null); }} className="flex-1 bg-zinc-200 dark:bg-zinc-700 px-4 py-2 rounded-lg font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600">Cancel</button>
                  </div>
                </div>
                )
              ) : (
                <>
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
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(reading)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(reading.id)} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Delete</button>
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
                </>
              )}
            </div>
          ))
        )}
      </main>

      <AdminNav active="history" />
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AssignmentsPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(5)

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
        <button className="bg-[#59f20d] text-[#121c0d] px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform">
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
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                <span className="text-xl">←</span>
              </button>
              <p className="font-bold text-base">October 2023</p>
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                <span className="text-xl">→</span>
              </button>
            </div>
            <div className="grid grid-cols-7 text-center gap-y-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <span key={i} className="text-[10px] font-bold text-zinc-400 uppercase">{day}</span>
              ))}
              {[28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((day, i) => (
                <button key={i} onClick={() => setSelectedDate(day)} className={`h-8 w-8 mx-auto flex items-center justify-center text-sm font-medium rounded-full ${day === selectedDate ? 'bg-[#59f20d] text-black shadow-md font-bold' : day < 28 ? 'text-zinc-300' : 'hover:bg-[#59f20d]/20'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#59f20d] text-xl">📖</span>
            <h2 className="text-lg font-bold">Passage</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Bible Book</label>
              <select className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d] focus:border-[#59f20d] transition-all">
                <option>Matthew</option>
                <option>Mark</option>
                <option>Luke</option>
                <option>John</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Chapter</label>
                <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" type="number" defaultValue="5"/>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Verses</label>
                <div className="flex items-center gap-2">
                  <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" placeholder="From" type="number" defaultValue="1"/>
                  <span className="text-zinc-400">-</span>
                  <input className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d]" placeholder="To" type="number" defaultValue="12"/>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[#59f20d] text-xl">❓</span>
              <h2 className="text-lg font-bold">Daily Quiz</h2>
            </div>
            <button className="text-[#59f20d] text-sm font-bold flex items-center gap-1">
              <span className="text-base">➕</span> New Question
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border-l-4 border-[#59f20d] border-y border-r border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-[#59f20d]/10 text-[#659c49] text-[10px] font-bold px-2 py-1 rounded-full uppercase">Question 1</span>
              <button className="text-zinc-400 hover:text-red-500">🗑️</button>
            </div>
            <textarea className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#59f20d] placeholder:text-zinc-400" placeholder="Type the question here..." rows={2}></textarea>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase block ml-1">Answer Choices</label>
              {['The Sermon on the Mount', 'Walking on Water', 'Healing the Blind'].map((choice, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2">
                    <input className="bg-transparent border-none p-0 w-full text-sm focus:ring-0" type="text" defaultValue={choice}/>
                  </div>
                  <button className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-[#59f20d] bg-[#59f20d] text-[#121c0d]' : 'border-zinc-200 dark:border-zinc-700 text-zinc-300'}`}>
                    {i === 0 ? '✓' : '○'}
                  </button>
                </div>
              ))}
              <button className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-400 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                + Add Choice
              </button>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-safe shadow-2xl">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 text-zinc-400">
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#59f20d]">
            <span className="text-2xl">📖</span>
            <span className="text-[10px] font-bold">Content</span>
          </button>
          <div className="relative -top-4">
            <button className="w-14 h-14 bg-[#59f20d] text-[#121c0d] rounded-full shadow-lg shadow-[#59f20d]/40 flex items-center justify-center border-4 border-[#f6f8f5] dark:border-[#162210]">
              <span className="text-3xl">💾</span>
            </button>
          </div>
          <button onClick={() => router.push('/admin/pending')} className="flex flex-col items-center gap-1 text-zinc-400">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-bold">Kids</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-400">
            <span className="text-2xl">⚙️</span>
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
        <div className="h-6 w-full flex items-center justify-center">
          <p className="text-[10px] text-zinc-400 italic">Draft auto-saved 2m ago</p>
        </div>
      </nav>
    </div>
  )
}

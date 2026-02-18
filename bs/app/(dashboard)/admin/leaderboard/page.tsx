'use client'

import { useRouter } from 'next/navigation'

export default function LeaderboardPage() {
  const router = useRouter()

  const topThree = [
    { name: 'Leo Grant', points: 1240, rank: 2 },
    { name: 'Amara Okafor', points: 1580, rank: 1 },
    { name: 'Benji Chen', points: 1115, rank: 3 }
  ]

  const students = [
    { name: 'Chloe Smith', points: 985, grade: 'Grade 1-A', books: 14, progress: 85 },
    { name: 'David Miller', points: 920, grade: 'Grade 1-B', books: 12, progress: 72 },
    { name: 'Elena Petrov', points: 880, grade: 'Grade 1-A', books: 10, progress: 60 },
    { name: 'Frankie Ruiz', points: 815, grade: 'Grade 2-C', books: 9, progress: 55 },
    { name: 'Grace Hopper', points: 760, grade: 'Grade 1-B', books: 8, progress: 45 }
  ]

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 bg-[#59f20d] rounded-full flex items-center justify-center text-[#162210] shadow-lg shadow-[#59f20d]/20">
              <span className="text-xl">🏆</span>
            </button>
            <div>
              <h1 className="text-xl font-bold leading-none">Leaderboard</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Reading Challenge 2024</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-xl">🔔</span>
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input className="w-full bg-white dark:bg-slate-800 border-none rounded-full py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#59f20d] shadow-sm placeholder:text-slate-400" placeholder="Search students..." type="text"/>
          </div>
          <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-xl">🎛️</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4">
          <button className="px-5 py-2 bg-[#59f20d] text-[#162210] rounded-full text-sm font-semibold whitespace-nowrap shadow-md shadow-[#59f20d]/20">All Students</button>
          <button className="px-5 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium whitespace-nowrap border border-slate-100 dark:border-slate-700">Grade 1-A</button>
          <button className="px-5 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium whitespace-nowrap border border-slate-100 dark:border-slate-700">Grade 1-B</button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24">
        <section className="grid grid-cols-3 gap-2 items-end mt-4 mb-8 bg-[#59f20d]/5 dark:bg-[#59f20d]/10 rounded-xl p-4 border border-[#59f20d]/10">
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 bg-slate-300 flex items-center justify-center text-2xl">👦</div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-700 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">2</div>
            </div>
            <p className="text-[10px] font-bold text-center truncate w-full">{topThree[0].name}</p>
            <p className="text-[10px] text-[#59f20d] font-bold">{topThree[0].points} pts</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-2 scale-110">
              <div className="w-20 h-20 rounded-full border-4 border-[#59f20d] bg-[#59f20d]/30 flex items-center justify-center text-3xl shadow-xl shadow-[#59f20d]/30">👧</div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#59f20d] text-[#162210] font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg">🏆</div>
            </div>
            <p className="text-xs font-bold text-center truncate w-full">{topThree[1].name}</p>
            <p className="text-xs text-[#59f20d] font-black">{topThree[1].points} pts</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full border-4 border-orange-200 bg-orange-100 flex items-center justify-center text-2xl">👦</div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-200 text-orange-800 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">3</div>
            </div>
            <p className="text-[10px] font-bold text-center truncate w-full">{topThree[2].name}</p>
            <p className="text-[10px] text-[#59f20d] font-bold">{topThree[2].points} pts</p>
          </div>
        </section>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Global Ranking</h2>
          <button className="text-xs font-bold text-[#59f20d] flex items-center gap-1 uppercase tracking-wider">
            Sort: Highest Score <span className="text-sm">▼</span>
          </button>
        </div>

        <div className="space-y-3">
          {students.map((student, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-50 dark:border-slate-700/50">
              <div className="w-6 text-center font-bold text-slate-400">{idx + 4}</div>
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl">👤</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm truncate">{student.name}</h3>
                  <span className="text-[#59f20d] font-bold text-sm">{student.points} pts</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mb-1 capitalize">{student.grade} • {student.books} Books</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#59f20d] rounded-full" style={{ width: `${student.progress}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{student.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-[#59f20d] text-[#162210] rounded-full flex items-center justify-center shadow-xl shadow-[#59f20d]/40 z-40">
        <span className="font-bold text-2xl">➕</span>
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#162210]/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 px-6 pt-3 pb-8 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-[#59f20d]">
            <span className="text-2xl">🏆</span>
            <p className="text-[10px] font-bold">Leaderboard</p>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
            <span className="text-2xl">👥</span>
            <p className="text-[10px] font-bold">Classes</p>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
            <span className="text-2xl">📊</span>
            <p className="text-[10px] font-bold">Reports</p>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
            <span className="text-2xl">⚙️</span>
            <p className="text-[10px] font-bold">Settings</p>
          </button>
        </div>
      </nav>
    </div>
  )
}

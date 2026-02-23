'use client'

import { useRouter } from 'next/navigation'

export default function LeaderboardPage() {
  const router = useRouter()

  const topThree = [
    { name: 'Emma L.', points: 980, rank: 2 },
    { name: 'Noah S.', points: 1250, rank: 1 },
    { name: 'Liam W.', points: 850, rank: 3 }
  ]

  const students = [
    { name: 'Sophia M.', points: 720, title: 'Master Reader' },
    { name: 'Lucas G.', points: 685, title: 'Quiz King' },
    { name: 'Chloe B.', points: 540, title: 'Star Explorer' },
    { name: 'James R.', points: 490, title: 'Brave Scout' }
  ]

  return (
    <div className="bg-[#f6f8f5] dark:bg-[#162210] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[#f6f8f5]/80 dark:bg-[#162210]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#59f20d] p-2 rounded-full shadow-lg shadow-[#59f20d]/20">
            <span className="text-white font-bold text-xl">🧭</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Top Explorers</h1>
        </div>
        <button className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
          <span className="text-slate-600 dark:text-slate-300 text-xl">🔔</span>
        </button>
      </header>

      <main className="flex-1 pb-40">
        <div className="px-6 pt-4 pb-8 flex items-end justify-center gap-2 sm:gap-6">
          <div className="flex flex-col items-center group">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden shadow-md bg-slate-200 flex items-center justify-center text-3xl">
                👧
              </div>
              <div className="absolute -bottom-2 -right-1 bg-slate-300 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">2</div>
            </div>
            <p className="text-sm font-bold truncate w-20 text-center">{topThree[0].name}</p>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{topThree[0].points} pts</span>
          </div>

          <div className="flex flex-col items-center scale-110">
            <div className="relative mb-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-4xl">
                🏆
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-[#59f20d] overflow-hidden shadow-xl shadow-[#59f20d]/20 bg-[#59f20d]/20 flex items-center justify-center text-5xl">
                👦
              </div>
              <div className="absolute -bottom-2 -right-1 bg-[#59f20d] text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">1</div>
            </div>
            <p className="text-base font-bold">{topThree[1].name}</p>
            <span className="text-xs uppercase font-bold text-white bg-[#59f20d] px-3 py-1 rounded-full shadow-sm">{topThree[1].points} pts</span>
          </div>

          <div className="flex flex-col items-center group">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full border-4 border-orange-300 overflow-hidden shadow-md bg-orange-100 flex items-center justify-center text-3xl">
                👦
              </div>
              <div className="absolute -bottom-2 -right-1 bg-orange-300 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">3</div>
            </div>
            <p className="text-sm font-bold truncate w-20 text-center">{topThree[2].name}</p>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{topThree[2].points} pts</span>
          </div>
        </div>

        <div className="px-6 space-y-3">
          {students.map((student, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-bold w-4 text-center">{idx + 4}</span>
                <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-2xl">
                  {idx % 2 === 0 ? '👧' : '👦'}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.title}</p>
                </div>
              </div>
              <div className="bg-[#59f20d]/10 px-3 py-1 rounded-full">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{student.points}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-[88px] left-0 right-0 px-6 z-10">
        <div className="max-w-md mx-auto bg-[#59f20d] text-white rounded-xl p-4 shadow-xl shadow-[#59f20d]/30 flex items-center justify-between border-2 border-white/20">
          <div className="flex items-center gap-4">
            <span className="font-black text-xl italic">12th</span>
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white/20 flex items-center justify-center text-2xl">
              😊
            </div>
            <div>
              <p className="font-bold leading-none">You (Sammy)</p>
              <p className="text-[10px] uppercase font-bold opacity-80">Almost at top 10!</p>
            </div>
          </div>
          <div className="bg-white text-[#59f20d] px-3 py-1 rounded-full font-black text-sm">
            325 pts
          </div>
        </div>
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl rounded-full px-2 py-2 flex items-center justify-around z-30 border border-slate-100 dark:border-slate-800">
        <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center gap-1 px-4 py-2 rounded-full text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-50">
          <span className="text-2xl">📖</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Read</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-6 py-2 rounded-full bg-[#59f20d] text-white shadow-lg shadow-[#59f20d]/40 scale-105 transition-all">
          <span className="text-2xl">📊</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Rank</span>
        </button>
        <button onClick={() => router.push('/profile')} className="flex flex-col items-center gap-1 px-4 py-2 rounded-full text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-50">
          <span className="text-2xl">👤</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Me</span>
        </button>
      </nav>

      <div className="fixed top-20 -left-10 w-40 h-40 bg-[#59f20d]/5 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-40 -right-10 w-60 h-60 bg-[#59f20d]/10 rounded-full blur-3xl -z-10"></div>
    </div>
  )
}

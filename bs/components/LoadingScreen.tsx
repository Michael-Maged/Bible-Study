'use client'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0d1a08] flex flex-col items-center justify-center z-[9999]">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-2 border-[#59f20d]/20 border-t-[#59f20d] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#59f20d" strokeWidth={1.5} className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      <p className="text-[#59f20d] font-black text-lg tracking-widest uppercase">Bible Kids</p>
      <p className="text-slate-500 text-xs mt-1 tracking-wider">Loading your journey...</p>
    </div>
  )
}

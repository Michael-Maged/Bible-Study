interface MessageBoxProps {
  type: 'success' | 'error'
  message: string
}

export default function MessageBox({ type, message }: MessageBoxProps) {
  const isError = type === 'error'
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
      isError
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-[#59f20d]/10 border-[#59f20d]/20 text-[#59f20d]'
    }`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-shrink-0 mt-0.5">
        {isError
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

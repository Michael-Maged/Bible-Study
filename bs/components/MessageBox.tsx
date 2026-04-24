import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageBoxProps {
  type: 'success' | 'error'
  message: string
  className?: string
}

export default function MessageBox({ type, message, className }: MessageBoxProps) {
  const isError = type === 'error'
  return (
    <div className={cn(
      'p-4 rounded-xl border flex items-start gap-3',
      isError
        ? 'bg-destructive/10 border-destructive/30 text-destructive'
        : 'bg-[oklch(0.596_0.145_162.48)]/10 border-[oklch(0.596_0.145_162.48)]/30 text-[oklch(0.596_0.145_162.48)]',
      className
    )}>
      {isError
        ? <XCircle size={20} className="flex-shrink-0 mt-0.5" />
        : <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />}
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

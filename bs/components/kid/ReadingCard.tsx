import { CheckCircle2, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ReadingCardProps {
  bookName: string
  reference: string
  isCompleted: boolean
  hasAttempted: boolean
  hasQuiz: boolean
  className?: string
}

export default function ReadingCard({
  bookName,
  reference,
  isCompleted,
  hasQuiz,
  className,
}: ReadingCardProps) {
  return (
    <div className={cn('rounded-2xl overflow-hidden border border-border shadow-lg bg-card', className)}>
      {/* Header */}
      <div className="relative h-52 bg-gradient-to-br from-primary to-[oklch(0.398_0.218_264.36)] flex items-end p-6">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <BookOpen size={120} className="text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest">
              Today&apos;s Reading
            </Badge>
            {hasQuiz && (
              <Badge variant="secondary" className="text-xs font-bold">
                Quiz Available
              </Badge>
            )}
          </div>
          <h3
            className="text-2xl font-black text-white leading-tight"
            dir="rtl"
            style={{ fontFamily: 'var(--font-arabic)' }}
          >
            {bookName}
          </h3>
        </div>
        {isCompleted && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <CheckCircle2 size={48} className="mx-auto mb-2 text-[oklch(0.596_0.145_162.48)]" />
              <span className="font-black text-lg">Completed!</span>
            </div>
          </div>
        )}
      </div>
      {/* Reference */}
      <div className="px-6 py-4 flex items-center gap-3">
        <Badge variant="outline" className="text-primary border-primary/30 font-semibold px-3 py-1">
          {reference}
        </Badge>
      </div>
    </div>
  )
}

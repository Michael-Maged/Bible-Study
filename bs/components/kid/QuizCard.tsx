import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuizOption {
  id: string
  option: string
}

interface QuizResult {
  correctAnswers: Array<{ question: string; correct_option: string }>
}

interface QuizCardProps {
  question: {
    id: string
    question: string
    options: QuizOption[]
    score: number
    correctCount: number
  }
  index: number
  selectedAnswers: string[]
  quizResult: QuizResult | null
  onToggle: (questionId: string, optionId: string, isMultiple: boolean) => void
  disabled?: boolean
}

export default function QuizCard({
  question,
  index,
  selectedAnswers,
  quizResult,
  onToggle,
  disabled = false,
}: QuizCardProps) {
  const isMultiple = question.correctCount > 1

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
          {index}
        </span>
        <p className="text-base font-bold flex-1 leading-snug">{question.question}</p>
        <Badge className="bg-accent/20 text-accent border-0 font-bold text-xs flex-shrink-0">
          {question.score} pts
        </Badge>
      </div>

      {isMultiple && (
        <p className="text-xs font-medium text-muted-foreground">Select all correct answers</p>
      )}

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers.includes(opt.id)
          const isCorrectOpt = quizResult?.correctAnswers.some(
            (ca) => ca.question === question.id && ca.correct_option === opt.id
          )
          const isWrong = quizResult && isSelected && !isCorrectOpt

          return (
            <button
              key={opt.id}
              onClick={() => onToggle(question.id, opt.id, isMultiple)}
              disabled={disabled || !!quizResult}
              className={cn(
                'w-full text-left px-4 rounded-lg border-2 transition-all flex items-center gap-3 font-medium text-sm',
                'min-h-[44px]',
                quizResult && isCorrectOpt
                  ? 'bg-[oklch(0.596_0.145_162.48)]/10 border-[oklch(0.596_0.145_162.48)] text-[oklch(0.596_0.145_162.48)]'
                  : isWrong
                  ? 'bg-destructive/10 border-destructive text-destructive'
                  : isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border hover:border-primary/40 text-foreground',
                (disabled || !!quizResult) && 'cursor-not-allowed'
              )}
            >
              {/* Indicator */}
              {isMultiple ? (
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                )}>
                  {isSelected && <span className="text-primary-foreground text-xs font-black">✓</span>}
                </div>
              ) : (
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              )}
              <span className="flex-1">{opt.option}</span>
              {quizResult && isCorrectOpt && <CheckCircle2 size={18} />}
              {isWrong && <XCircle size={18} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

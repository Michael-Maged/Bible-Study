import { cn } from '@/lib/utils'

interface BiblePassageProps {
  verses: string[]
  className?: string
}

function parseVerse(raw: string) {
  const parts = raw.split(/(\d+)\s/)
  const result: Array<{ type: 'number' | 'text'; text: string }> = []
  parts.forEach((part) => {
    if (!part.trim()) return
    if (/^\d+$/.test(part)) {
      result.push({ type: 'number', text: part })
    } else {
      result.push({ type: 'text', text: part })
    }
  })
  return result
}

export default function BiblePassage({ verses, className }: BiblePassageProps) {
  return (
    <div
      dir="rtl"
      className={cn(
        'rounded-xl p-6 space-y-4',
        className
      )}
      style={{
        backgroundColor: 'var(--arabic-bg)',
        color: 'var(--arabic-text)',
        fontFamily: 'var(--font-arabic)',
        fontSize: '1.25rem',
        lineHeight: '2.2',
      }}
    >
      {verses.map((verse, idx) => {
        const tokens = parseVerse(verse)
        return (
          <p key={idx} className="leading-loose">
            {tokens.map((token, i) =>
              token.type === 'number' ? (
                <span key={i} className="text-primary font-bold text-sm mx-1">
                  {token.text}
                </span>
              ) : (
                <span key={i}>{token.text}</span>
              )
            )}
          </p>
        )
      })}
    </div>
  )
}

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KidSummaryTileProps {
  kidId: string
  kidName: string
  readToday: boolean
  score?: number
  className?: string
  onTap: () => void
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function KidSummaryTile({ kidName, readToday, score, className, onTap }: KidSummaryTileProps) {
  return (
    <button
      onClick={onTap}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 min-h-[56px]',
        'hover:bg-muted/50 transition-colors text-left',
        className
      )}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
          {getInitials(kidName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{kidName}</p>
        {score !== undefined && (
          <p className="text-xs text-muted-foreground">{score} pts</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          variant={readToday ? 'default' : 'secondary'}
          className={cn(
            'text-xs font-bold',
            readToday
              ? 'bg-[oklch(0.596_0.145_162.48)]/15 text-[oklch(0.596_0.145_162.48)] border-[oklch(0.596_0.145_162.48)]/30'
              : 'bg-accent/15 text-accent border-accent/30'
          )}
        >
          {readToday ? 'Read' : 'Pending'}
        </Badge>
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
    </button>
  )
}

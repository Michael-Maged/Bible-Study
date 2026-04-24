import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'success' | 'warning'
  className?: string
}

const variantMap = {
  default: 'text-primary',
  success: 'text-[oklch(0.596_0.145_162.48)]',
  warning: 'text-accent',
}

const trendIconMap = { up: TrendingUp, down: TrendingDown, neutral: Minus }
const trendColorMap = { up: 'text-[oklch(0.596_0.145_162.48)]', down: 'text-destructive', neutral: 'text-muted-foreground' }

export default function StatCard({ label, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  const TrendIcon = trend ? trendIconMap[trend] : null
  return (
    <Card className={cn('p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className={cn('text-3xl font-black', variantMap[variant])}>{value}</span>
        {TrendIcon && (
          <TrendIcon size={16} className={cn(trendColorMap[trend!])} />
        )}
      </div>
    </Card>
  )
}

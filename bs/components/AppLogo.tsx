import { cn } from '@/lib/utils'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: { img: 18, wrapper: 'w-7 h-7', text: 'text-base' },
  md: { img: 28, wrapper: 'w-9 h-9', text: 'text-lg' },
  lg: { img: 36, wrapper: 'w-11 h-11', text: 'text-2xl' },
}

export default function AppLogo({ size = 'md', showText = true, className }: AppLogoProps) {
  const s = sizeMap[size]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('rounded-xl bg-accent border border-border flex items-center justify-center flex-shrink-0 overflow-hidden', s.wrapper)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon0.svg"
          alt="Bible Kids"
          width={s.img}
          height={s.img}
          style={{ objectFit: 'contain' }}
        />
      </div>
      {showText && (
        <span className={cn('font-extrabold tracking-tight text-foreground', s.text)}>
          Bible Kids
        </span>
      )}
    </div>
  )
}

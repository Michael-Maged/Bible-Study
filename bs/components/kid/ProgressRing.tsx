'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  color?: 'primary' | 'accent' | 'success'
  animated?: boolean
  className?: string
}

const sizeMap = { sm: 48, md: 80, lg: 120 }
const strokeMap = { sm: 4, md: 6, lg: 8 }
const colorMap = {
  primary: 'oklch(0.457 0.241 264.05)',
  accent: 'oklch(0.666 0.179 60.88)',
  success: 'oklch(0.596 0.145 162.48)',
}

export default function ProgressRing({
  value,
  size = 'md',
  label,
  color = 'primary',
  animated = true,
  className,
}: ProgressRingProps) {
  const dim = sizeMap[size]
  const stroke = strokeMap[size]
  const radius = (dim - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: dim, height: dim }}
    >
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-border"
        />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke={colorMap[color]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animated ? offset : offset }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <span
        className="absolute text-xs font-black text-foreground"
        style={{ fontSize: size === 'lg' ? '1rem' : '0.7rem' }}
      >
        {label ?? `${value}%`}
      </span>
    </div>
  )
}

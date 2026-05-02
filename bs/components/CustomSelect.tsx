'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder: string
  icon: string
  disabled?: boolean
  required?: boolean
}

export default function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled = false,
  required = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (disabled || options.length === 0) setIsOpen(false) }, [disabled, options.length])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function updatePosition() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 })
    }
  }

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  const selectedLabel = options.find(opt => opt.value === value)?.label || ''

  function openDropdown() {
    if (disabled) return
    updatePosition()
    setIsOpen(prev => !prev)
  }

  const triggerClass = `w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`

  return (
    <div ref={containerRef} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-sm">{icon}</span>

      {/* Mobile: native select */}
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        onChange={e => onChange(e.target.value)}
        className={`md:hidden ${triggerClass} ${!value ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>

      {/* Desktop: hidden input + custom dropdown */}
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        className={`hidden md:flex items-center text-left ${triggerClass} ${!selectedLabel ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {selectedLabel || placeholder}
      </button>

      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
        <ChevronDown size={14} />
      </span>

      {mounted && isOpen && !disabled && createPortal(
        <div
          style={dropdownStyle}
          onMouseDown={e => e.stopPropagation()}
          className="bg-card rounded-xl shadow-xl border border-border max-h-60 overflow-y-auto"
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onMouseDown={e => { e.stopPropagation(); onChange(option.value); setIsOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary hover:text-primary-foreground transition-colors first:rounded-t-xl last:rounded-b-xl ${value === option.value ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'}`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

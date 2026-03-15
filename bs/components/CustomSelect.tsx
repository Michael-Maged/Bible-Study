'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

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

  useEffect(() => { setMounted(true) }, [])
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
  const baseClass = `w-full pl-12 pr-10 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white focus:ring-2 focus:ring-[#6ef516] transition-all appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`

  function openDropdown() {
    if (disabled) return
    updatePosition()
    setIsOpen(prev => !prev)
  }

  return (
    <div ref={containerRef} className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 pointer-events-none z-10">{icon}</span>

      {/* Mobile: native select */}
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        onChange={e => onChange(e.target.value)}
        className={`md:hidden ${baseClass} ${!value ? 'text-[#7cb85f]/50' : ''}`}
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
        className={`hidden md:flex items-center ${baseClass} text-left ${!selectedLabel ? 'text-[#7cb85f]/50' : ''}`}
      >
        {selectedLabel || placeholder}
      </button>

      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6ef516]/60">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {mounted && isOpen && !disabled && createPortal(
        <div
          style={dropdownStyle}
          onMouseDown={e => e.stopPropagation()}
          className="bg-white dark:bg-[#243d1c] rounded-2xl shadow-xl shadow-[#6ef516]/10 max-h-60 overflow-y-auto border border-[#6ef516]/20"
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onMouseDown={e => { e.stopPropagation(); onChange(option.value); setIsOpen(false) }}
              className={`w-full px-4 py-3 text-left hover:bg-[#6ef516] hover:text-[#0d1a08] transition-colors first:rounded-t-2xl last:rounded-b-2xl ${value === option.value ? 'bg-[#6ef516]/20 font-semibold' : 'text-[#0d1a08] dark:text-white'}`}
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

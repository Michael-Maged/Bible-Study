'use client'

import { useState, useRef, useEffect } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(opt => opt.value === value)?.label || ''

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516] pointer-events-none z-10">
        {icon}
      </span>
      
      <input type="hidden" name={name} value={value} required={required} />
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        suppressHydrationWarning
        className={`w-full pl-12 pr-4 py-4 bg-[#f0fde4] dark:bg-[#1a2c14] border-none rounded-full text-[#0d1a08] dark:text-white focus:ring-2 focus:ring-[#6ef516] transition-all appearance-none text-left ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${!selectedLabel ? 'text-[#7cb85f]/50' : ''}`}
      >
        {selectedLabel || placeholder}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-2 mb-2 bg-white dark:bg-[#243d1c] rounded-2xl shadow-xl shadow-[#6ef516]/10 max-h-60 overflow-y-auto border border-[#6ef516]/20 bottom-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 text-left hover:bg-[#6ef516] hover:text-[#0d1a08] transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                value === option.value
                  ? 'bg-[#6ef516]/20 text-[#0d1a08] dark:text-white font-semibold'
                  : 'text-[#0d1a08] dark:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

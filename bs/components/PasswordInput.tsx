'use client'

import { useState } from 'react'

interface PasswordInputProps {
  name: string
  placeholder?: string
  required?: boolean
  minLength?: number
  className?: string
  icon?: React.ReactNode
}

export default function PasswordInput({
  name,
  placeholder,
  required = false,
  minLength,
  className = '',
  icon
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative group">
      {icon && typeof icon === 'string' ? (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6ef516]/60 group-focus-within:text-[#6ef516]">
          {icon}
        </span>
      ) : icon ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#59f20d]">
          {icon}
        </svg>
      ) : null}
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={`w-full ${icon ? (typeof icon === 'string' ? 'pl-12' : 'pl-11') : 'pl-4'} pr-12 h-14 bg-[#1a2e12] dark:bg-[#1a2c14] border border-[#59f20d]/10 dark:border-[#6ef516]/10 rounded-2xl dark:rounded-full text-sm text-slate-100 dark:text-white focus:outline-none focus:border-[#59f20d]/40 dark:focus:ring-2 dark:focus:ring-[#6ef516] transition-colors ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#59f20d] dark:hover:text-[#6ef516] transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM12 3v1m6.364 1.636l-.707.707M21 12h-1m-1.636-6.364l-.707-.707M5.05 5.05l-.707-.707M12 21v-1m6.364-1.636l.707.707M3 12h1m1.636 6.364l.707.707" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

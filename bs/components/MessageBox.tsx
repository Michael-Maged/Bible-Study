interface MessageBoxProps {
  type: 'success' | 'error'
  message: string
}

export default function MessageBox({ type, message }: MessageBoxProps) {
  const isError = type === 'error'
  
  return (
    <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
      isError 
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' 
        : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
    }`}>
      <span className="text-2xl flex-shrink-0">
        {isError ? '⚠️' : '✅'}
      </span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          isError 
            ? 'text-red-800 dark:text-red-200' 
            : 'text-green-800 dark:text-green-200'
        }`}>
          {message}
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

export function useOfflineData<T>(
  fetchFn: () => Promise<{ success: boolean; data?: T }>,
  getCached: () => T | null,
  setCached: (data: T) => void
): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) {
        const cached = getCached()
        if (cached) setData(cached)
        setLoading(false)
        return
      }

      let timeoutFired = false
      const timeout = setTimeout(() => {
        timeoutFired = true
        const cached = getCached()
        if (cached) setData(cached)
        setLoading(false)
      }, 3000)

      try {
        const result = await fetchFn()
        if (!timeoutFired) {
          clearTimeout(timeout)
          if (result.success && result.data !== undefined) {
            setData(result.data ?? null)
            if (result.data) setCached(result.data)
          }
          setLoading(false)
        }
      } catch {
        if (!timeoutFired) {
          clearTimeout(timeout)
          const cached = getCached()
          if (cached) setData(cached)
          setLoading(false)
        }
      }
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading }
}

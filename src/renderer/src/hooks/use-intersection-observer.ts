import * as React from 'react'

export function useIntersectionObserver<T extends HTMLElement>({
  threshold = 0.1,
  rootMargin = '100px',
  onIntersect,
  enabled = true
}: {
  threshold?: number
  rootMargin?: string
  onIntersect: () => void
  enabled?: boolean
}) {
  const triggerRef = React.useRef<T>(null)

  React.useEffect(() => {
    if (!enabled) return

    const el = triggerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(el)

    return () => {
      observer.unobserve(el)
    }
  }, [enabled, threshold, rootMargin, onIntersect])

  return triggerRef
}

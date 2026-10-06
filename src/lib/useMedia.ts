import { useLayoutEffect, useRef, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useLayoutEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** True when every data row can be at least `minRow` px tall inside the frame. */
export function useRowFit(rows: number, header: number, minRow = 16) {
  const ref = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(true)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || rows <= 0) return
    const measure = () => {
      setFit((element.clientHeight - header) / rows >= minRow)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [rows, header, minRow])
  return { ref, fit }
}

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { NowPlaying } from '../../components/NowPlaying'

type EmbedTheme = 'dark' | 'light' | 'user'

function parseTheme(value: string | null): EmbedTheme {
  if (value === 'dark' || value === 'light' || value === 'user') {
    return value
  }

  return 'user'
}

export default function NowPlayingEmbed() {
  const [searchParams] = useSearchParams()
  const requestedTheme = parseTheme(searchParams.get('theme'))
  const [prefersDark, setPrefersDark] = useState<boolean>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    if (requestedTheme !== 'user') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    }

    mediaQuery.addListener(onChange)
    return () => mediaQuery.removeListener(onChange)
  }, [requestedTheme])

  const isDark = useMemo(() => {
    if (requestedTheme === 'dark') {
      return true
    }

    if (requestedTheme === 'light') {
      return false
    }

    return prefersDark
  }, [prefersDark, requestedTheme])

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={isDark ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-white text-gray-900'}>
        <NowPlaying />
      </div>
    </div>
  )
}

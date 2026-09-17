import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveShellMode, type ShellMode } from './shell'

/**
 * Syncs shell mode onto <html> before paint so chrome clearance never jumps.
 * Also accepts legacy data-rn-shell="hero" as alias of overlay in CSS.
 */
export default function ShellProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const mode: ShellMode = resolveShellMode(pathname)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.rnShell = mode
    root.setAttribute('data-rn-shell', mode)
    // Legacy alias for any lingering CSS selectors
    if (mode === 'overlay') {
      root.setAttribute('data-rn-shell-legacy', 'hero')
    } else {
      root.removeAttribute('data-rn-shell-legacy')
    }
  }, [mode, pathname])

  return <>{children}</>
}

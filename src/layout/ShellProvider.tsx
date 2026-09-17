import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveShellMode, type ShellMode } from './shell'

/**
 * Syncs the active shell mode onto <html> so CSS + Header share one contract.
 */
export default function ShellProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const mode: ShellMode = resolveShellMode(pathname)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.rnShell = mode
    root.setAttribute('data-rn-shell', mode)
  }, [mode, pathname])

  return <>{children}</>
}

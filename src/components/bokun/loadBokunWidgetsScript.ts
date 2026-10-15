import { BOKUN_LOADER_SRC } from '../../lib/bokun'

const SCRIPT_ID = 'bokun-widgets-loader'
let loadPromise: Promise<void> | null = null

/**
 * Loads the official Bókun WidgetsLoader once per page session.
 * Safe for SPA navigation — does not inject duplicates.
 */
export function loadBokunWidgetsScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    if ((window as unknown as { BokunWidgetsLoader?: unknown }).BokunWidgetsLoader) {
      return Promise.resolve()
    }
    return (
      loadPromise ??
      new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('Bókun loader failed')), {
          once: true,
        })
      })
    )
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = BOKUN_LOADER_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Bókun loader failed to load'))
    document.head.appendChild(script)
  })

  return loadPromise
}

/** Ask Bókun to (re)scan the DOM for .bokunWidget nodes after SPA mounts. */
export function refreshBokunWidgets(): void {
  const w = window as unknown as {
    BokunWidgetsLoader?: { refresh?: () => void; init?: () => void }
  }
  try {
    w.BokunWidgetsLoader?.refresh?.()
    w.BokunWidgetsLoader?.init?.()
  } catch {
    /* ignore — loader API varies by version */
  }
}

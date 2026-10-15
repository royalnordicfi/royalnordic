import { BOKUN_BOOKING_CHANNEL_UUID, bokunLoaderSrc } from '../../lib/bokun'

const promises = new Map<string, Promise<void>>()

function scriptIdFor(channelUuid: string) {
  return `bokun-widgets-loader-${channelUuid}`
}

/**
 * Loads the official Bókun WidgetsLoader for a booking channel.
 * One script tag per channel — partners (Lapland Legacy, Santa Claus Reindeer)
 * must not share a single channel UUID.
 */
export function loadBokunWidgetsScript(
  bookingChannelUUID: string = BOKUN_BOOKING_CHANNEL_UUID,
): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()

  const id = scriptIdFor(bookingChannelUUID)
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing) {
    const cached = promises.get(bookingChannelUUID)
    if (cached) return cached
    if ((window as unknown as { BokunWidgetsLoader?: unknown }).BokunWidgetsLoader) {
      return Promise.resolve()
    }
    const pending = new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Bókun loader failed')), {
        once: true,
      })
    })
    promises.set(bookingChannelUUID, pending)
    return pending
  }

  const loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = id
    script.src = bokunLoaderSrc(bookingChannelUUID)
    script.async = true
    script.dataset.bokunChannel = bookingChannelUUID
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Bókun loader failed to load'))
    document.head.appendChild(script)
  })

  promises.set(bookingChannelUUID, loadPromise)
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

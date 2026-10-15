import { useEffect, useId, useRef, useState } from 'react'
import {
  BOKUN_BOOKING_CHANNEL_UUID,
  bokunExperienceCalendarSrc,
} from '../../lib/bokun'
import { loadBokunWidgetsScript, refreshBokunWidgets } from './loadBokunWidgetsScript'

type Props = {
  experienceId: string
  bookingChannelUUID?: string
  className?: string
}

/**
 * Official Bókun experience-calendar embed.
 * Loads the partner script once and remounts cleanly on client-side navigation.
 * Checkout stays inside Bókun — do not also open Royal Nordic Stripe for this product.
 */
export default function BokunExperienceCalendar({
  experienceId,
  bookingChannelUUID = BOKUN_BOOKING_CHANNEL_UUID,
  className = '',
}: Props) {
  const reactId = useId()
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    host.innerHTML = ''
    const widget = document.createElement('div')
    widget.className = 'bokunWidget'
    widget.dataset.src = bokunExperienceCalendarSrc(experienceId, bookingChannelUUID)
    widget.setAttribute('data-rn-bokun', reactId)
    host.appendChild(widget)

    loadBokunWidgetsScript(bookingChannelUUID)
      .then(() => {
        if (cancelled) return
        // Give the loader a tick to observe the new node
        window.requestAnimationFrame(() => {
          refreshBokunWidgets()
          if (!cancelled) setStatus('ready')
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
  }, [experienceId, bookingChannelUUID, reactId])

  return (
    <div className={`rn-bokun ${className}`}>
      {status === 'loading' && (
        <p className="py-6 text-center text-sm text-panel-muted">Loading booking calendar…</p>
      )}
      {status === 'error' && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          The booking calendar could not load. Please refresh the page or contact us at{' '}
          <a className="underline" href="mailto:contact@royalnordic.fi">
            contact@royalnordic.fi
          </a>
          .
        </p>
      )}
      <div ref={hostRef} className="rn-bokun__host min-h-[12rem]" />
      <noscript>
        <p className="text-sm text-panel-muted">Please enable JavaScript in your browser to book.</p>
      </noscript>
    </div>
  )
}

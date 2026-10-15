import { useEffect, useId, useRef, useState } from 'react'
import {
  BOKUN_REINDEER_PRODUCT_LIST_ID,
  BOKUN_SANTA_CLAUS_REINDEER_CHANNEL_UUID,
  bokunProductListSrc,
} from '../../lib/bokun'
import { loadBokunWidgetsScript, refreshBokunWidgets } from './loadBokunWidgetsScript'

type Props = {
  productListId?: string
  bookingChannelUUID?: string
  className?: string
}

/**
 * Official Bókun product-list embed for partner catalogues.
 * Uses the partner booking channel — do not reuse Lapland Legacy’s snowmobile channel.
 */
export default function BokunProductList({
  productListId = BOKUN_REINDEER_PRODUCT_LIST_ID,
  bookingChannelUUID = BOKUN_SANTA_CLAUS_REINDEER_CHANNEL_UUID,
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
    widget.dataset.src = bokunProductListSrc(productListId, bookingChannelUUID)
    widget.setAttribute('data-rn-bokun', reactId)
    host.appendChild(widget)

    loadBokunWidgetsScript(bookingChannelUUID)
      .then(() => {
        if (cancelled) return
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
  }, [productListId, bookingChannelUUID, reactId])

  return (
    <div className={`rn-bokun rn-bokun--product-list ${className}`}>
      {status === 'loading' && (
        <p className="py-8 text-center text-sm text-panel-muted">Loading experiences…</p>
      )}
      {status === 'error' && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          The booking widget could not load. Please refresh the page or contact us at{' '}
          <a className="underline" href="mailto:contact@royalnordic.fi">
            contact@royalnordic.fi
          </a>
          .
        </p>
      )}
      <div ref={hostRef} className="rn-bokun__host min-h-[16rem]" />
      <noscript>
        <p className="text-sm text-panel-muted">Please enable JavaScript in your browser to book.</p>
      </noscript>
    </div>
  )
}

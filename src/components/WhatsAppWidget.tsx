import React, { useRef } from 'react'
import { MessageCircle } from 'lucide-react'

const WhatsAppWidget = () => {
  const whatsappUrl = 'https://wa.me/message/32DREESZC5QUB1'
  const lockedUntil = useRef(0)

  const handleWhatsAppClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const now = Date.now()
    if (now < lockedUntil.current) return
    lockedUntil.current = now + 1000

    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    if (!newWindow) {
      window.location.href = whatsappUrl
    }
  }

  return (
    <div className="whatsapp-widget fixed z-[60] pointer-events-auto">
      <button
        type="button"
        onClick={handleWhatsAppClick}
        className="flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-500 active:bg-emerald-700"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="h-5 w-5 lg:h-7 lg:w-7" />
      </button>
    </div>
  )
}

export default WhatsAppWidget

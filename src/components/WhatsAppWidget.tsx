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
        className="whatsapp-widget__btn flex items-center justify-center rounded-full border border-white/[0.08] bg-[#0a1612]/92 text-aurora-soft/90 shadow-[0_6px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm transition duration-300 hover:border-aurora/30 hover:bg-[#0d1c17] hover:text-aurora-soft"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" strokeWidth={1.65} />
      </button>
    </div>
  )
}

export default WhatsAppWidget

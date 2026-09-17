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
        className="flex items-center justify-center rounded-full border border-white/10 bg-[#0c1f18] text-aurora-soft shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition duration-300 hover:border-aurora/35 hover:bg-[#10261d] hover:text-white"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.75} />
      </button>
    </div>
  )
}

export default WhatsAppWidget

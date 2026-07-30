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
    <div className="whatsapp-widget fixed bottom-6 right-6 z-[60] pointer-events-auto transition-opacity duration-300">
      <button
        type="button"
        onClick={handleWhatsAppClick}
        className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-4 rounded-full shadow-xl transition-transform duration-300 hover:scale-105 active:scale-95 min-h-[56px] min-w-[56px] flex items-center justify-center"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  )
}

export default WhatsAppWidget

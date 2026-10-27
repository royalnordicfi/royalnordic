import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import PromotionAnnouncementBar from '../components/PromotionAnnouncementBar'
import WhatsAppWidget from '../components/WhatsAppWidget'
import WinterPromoPopup from '../components/WinterPromoPopup'
import { isMinimalChromePath } from './shell'

/** Global marketing chrome — hidden on checkout / payment confirmation. */
export default function SiteChrome() {
  const { pathname } = useLocation()
  if (isMinimalChromePath(pathname)) return null

  return (
    <>
      <PromotionAnnouncementBar />
      <Header />
      <WinterPromoPopup />
      <WhatsAppWidget />
    </>
  )
}

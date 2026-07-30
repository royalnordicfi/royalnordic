import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Menu,
  X,
  Phone,
  Mail,
  Instagram,
  Home,
  Sparkles,
  Compass,
  Car,
  Handshake,
  Info,
  BookOpen,
  MessageCircle,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const WHATSAPP_URL = 'https://wa.me/message/32DREESZC5QUB1'
const INSTAGRAM_URL = 'https://www.instagram.com/royalnordic.fi/'
const TIKTOK_URL = 'https://www.tiktok.com/@royalnordic'

type NavItem = {
  id: string
  label: string
  subtitle: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  action: 'home' | 'section' | 'route'
  target: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    subtitle: 'Premium Lapland experiences from Rovaniemi',
    icon: Home,
    action: 'home',
    target: '/',
  },
  {
    id: 'tours',
    label: 'Tours',
    subtitle: 'Northern Lights, ice fishing & Arctic day trips',
    icon: Sparkles,
    action: 'section',
    target: 'tours',
  },
  {
    id: 'customized',
    label: 'Customized Experiences',
    subtitle: 'Private itineraries tailored to your group',
    icon: Compass,
    action: 'route',
    target: '/customized-tour',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    subtitle: 'Private transfers across Finnish Lapland',
    icon: Car,
    action: 'section',
    target: 'transportation',
  },
  {
    id: 'partners',
    label: 'Partner With Us',
    subtitle: 'Travel trade & agency partnerships',
    icon: Handshake,
    action: 'route',
    target: '/travel-trade',
  },
  {
    id: 'about',
    label: 'About',
    subtitle: 'Local guides. Small groups. Royal Nordic.',
    icon: Info,
    action: 'section',
    target: 'about',
  },
  {
    id: 'blog',
    label: 'Blog',
    subtitle: 'Lapland travel guides & winter tips',
    icon: BookOpen,
    action: 'route',
    target: '/blog',
  },
  {
    id: 'contact',
    label: 'Contact',
    subtitle: 'Speak with our team in Rovaniemi',
    icon: MessageCircle,
    action: 'section',
    target: 'contact',
  },
]

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuMounted, setIsMenuMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const scrollLockY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      if (scrollY < 0) {
        window.scrollTo(0, 0)
        return
      }
      setIsScrolled(scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const lockBodyScroll = useCallback(() => {
    scrollLockY.current = window.scrollY
    document.documentElement.classList.add('mobile-nav-open')
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollLockY.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  }, [])

  const unlockBodyScroll = useCallback(() => {
    document.documentElement.classList.remove('mobile-nav-open')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    window.scrollTo(0, scrollLockY.current)
  }, [])

  const openMenu = useCallback(() => {
    setIsMenuMounted(true)
    lockBodyScroll()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsMenuOpen(true))
    })
  }, [lockBodyScroll])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const toggleMenu = () => {
    if (isMenuOpen || isMenuMounted) closeMenu()
    else openMenu()
  }

  useEffect(() => {
    if (!isMenuMounted || isMenuOpen) return
    const timer = window.setTimeout(() => {
      setIsMenuMounted(false)
      unlockBodyScroll()
      openButtonRef.current?.focus()
    }, 420)
    return () => window.clearTimeout(timer)
  }, [isMenuMounted, isMenuOpen, unlockBodyScroll])

  useEffect(() => {
    if (!isMenuOpen) return
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }
      if (event.key !== 'Tab' || !menuRef.current) return

      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen, closeMenu])

  useEffect(() => () => {
    document.documentElement.classList.remove('mobile-nav-open')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
  }, [])

  const goHome = () => {
    closeMenu()
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home') {
      if (location.pathname !== '/') navigate('/')
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), location.pathname !== '/' ? 120 : 0)
      return
    }
    const run = () => {
      const element = document.getElementById(sectionId)
      if (element) element.scrollIntoView({ behavior: 'smooth' })
    }
    if (location.pathname !== '/') {
      navigate('/')
      window.setTimeout(run, 120)
    } else {
      run()
    }
  }

  const handleNavItem = (item: NavItem) => {
    closeMenu()
    window.setTimeout(() => {
      if (item.action === 'home') {
        navigate('/')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (item.action === 'section') {
        scrollToSection(item.target)
      } else {
        navigate(item.target)
      }
    }, 80)
  }

  const BrandMark = ({
    centered = false,
    onNavigate,
  }: {
    centered?: boolean
    onNavigate?: () => void
  }) => (
    <button
      type="button"
      onClick={onNavigate ?? goHome}
      className={`flex flex-col ${centered ? 'items-center' : 'items-start sm:items-center'} space-y-0.5 min-h-[44px] bg-transparent border-0 p-0 cursor-pointer`}
      aria-label="Royal Nordic home"
    >
      <img
        src="/logo.png"
        alt=""
        className="h-9 sm:h-10 w-auto object-contain"
        width={40}
        height={40}
      />
      <span className="text-base sm:text-lg font-luxury font-bold text-white italic tracking-wide hover:text-emerald-300 transition-colors duration-300">
        ROYAL NORDIC
      </span>
    </button>
  )

  const mobileMenu =
    isMenuMounted &&
    createPortal(
      <div
        ref={menuRef}
        className={`rn-mobile-nav fixed inset-0 z-[100] md:hidden ${isMenuOpen ? 'is-open' : ''}`}
        id="mobile-fullscreen-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <div className="rn-mobile-nav__panel absolute inset-0 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-white/10">
            <BrandMark centered={false} onNavigate={() => { closeMenu(); navigate('/') }} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              className="text-white/90 hover:text-emerald-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
              aria-label="Close menu"
            >
              <X size={26} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-6">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item, index) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.id}
                    className="rn-mobile-nav__item"
                    style={{ transitionDelay: isMenuOpen ? `${80 + index * 45}ms` : '0ms' }}
                  >
                    <button
                      type="button"
                      onClick={() => handleNavItem(item)}
                      className="w-full flex items-start gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors min-h-[64px]"
                    >
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block font-luxury text-xl text-white tracking-wide">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-gray-400 font-clean leading-snug">
                          {item.subtitle}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div
            className="rn-mobile-nav__footer border-t border-white/10 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-4"
            style={{ transitionDelay: isMenuOpen ? '420ms' : '0ms' }}
          >
            <div className="grid grid-cols-5 gap-2">
              <a
                href="tel:+3584578345138"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 py-3 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors min-h-[64px]"
                aria-label="Call Royal Nordic"
              >
                <Phone size={18} />
                <span className="text-[10px] uppercase tracking-wider">Phone</span>
              </a>
              <a
                href="mailto:contact@royalnordic.fi"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 py-3 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors min-h-[64px]"
                aria-label="Email Royal Nordic"
              >
                <Mail size={18} />
                <span className="text-[10px] uppercase tracking-wider">Email</span>
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 py-3 text-gray-300 hover:text-pink-400 hover:border-pink-500/40 transition-colors min-h-[64px]"
                aria-label="Instagram"
              >
                <Instagram size={18} />
                <span className="text-[10px] uppercase tracking-wider">IG</span>
              </a>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 py-3 text-gray-300 hover:text-white hover:border-white/30 transition-colors min-h-[64px]"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
                <span className="text-[10px] uppercase tracking-wider">TikTok</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-3 text-emerald-400 hover:bg-emerald-500/25 transition-colors min-h-[64px]"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
                <span className="text-[10px] uppercase tracking-wider">Chat</span>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleNavItem(NAV_ITEMS.find((i) => i.id === 'partners')!)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-emerald-500/40 hover:text-emerald-300 transition-colors min-h-[48px]"
              >
                Become a Partner
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  window.setTimeout(() => navigate('/customized-tour'), 80)
                }}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors min-h-[48px]"
              >
                Request Custom Tour
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-black/95 backdrop-blur-xl shadow-2xl border-b border-gray-700'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Mobile header */}
          <div className="md:hidden relative flex items-center justify-end h-20">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <BrandMark centered />
            </div>
            <button
              ref={openButtonRef}
              type="button"
              onClick={toggleMenu}
              className="relative z-10 text-gray-200 hover:text-white transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-fullscreen-nav"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop header */}
          <div className="hidden md:flex justify-between items-center h-24 pt-1">
            <div className="flex-shrink-0 pl-2">
              <BrandMark />
            </div>

            <nav className="flex items-center space-x-3 lg:space-x-5">
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                HOME
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('tours')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                TOURS
              </button>
              <button
                type="button"
                onClick={() => navigate('/customized-tour')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                CUSTOMIZED
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('transportation')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                TRANSPORTATION
              </button>
              <button
                type="button"
                onClick={() => navigate('/travel-trade')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                PARTNERS
              </button>
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                BLOG
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
              >
                CONTACT
              </button>
            </nav>

            <div className="hidden xl:flex items-center space-x-6 mr-8">
              <div className="flex flex-col space-y-2 text-xs text-gray-300 font-clean">
                <div className="flex items-center space-x-2">
                  <Mail size={12} />
                  <a href="mailto:contact@royalnordic.fi" className="hover:text-emerald-400 transition-colors">
                    contact@royalnordic.fi
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={12} />
                  <a href="tel:+3584578345138" className="hover:text-emerald-400 transition-colors">
                    +358 45 78345138
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 transition-colors duration-200"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                  aria-label="Follow us on TikTok"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
      {mobileMenu}
    </>
  )
}

export default Header

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X, Phone, Mail, Instagram } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const WHATSAPP_URL = 'https://wa.me/message/32DREESZC5QUB1'
const INSTAGRAM_URL = 'https://www.instagram.com/royalnordic.fi/'
const TIKTOK_URL = 'https://www.tiktok.com/@royalnordic'

type NavItem = {
  id: string
  label: string
  action: 'home' | 'section' | 'route'
  target: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', action: 'home', target: '/' },
  { id: 'tours', label: 'Tours', action: 'section', target: 'tours' },
  { id: 'customized', label: 'Customized Experiences', action: 'route', target: '/customized-tour' },
  { id: 'transportation', label: 'Transportation', action: 'section', target: 'transportation' },
  { id: 'partners', label: 'Partner With Us', action: 'route', target: '/travel-trade' },
  { id: 'about', label: 'About Us', action: 'section', target: 'about' },
  { id: 'blog', label: 'Blog', action: 'route', target: '/blog' },
  { id: 'contact', label: 'Contact Us', action: 'section', target: 'contact' },
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
  const afterCloseRef = useRef<(() => void) | null>(null)

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

  const closeMenu = useCallback((after?: () => void) => {
    if (!isMenuMounted) {
      after?.()
      return
    }
    afterCloseRef.current = after ?? null
    setIsMenuOpen(false)
  }, [isMenuMounted])

  const toggleMenu = () => {
    if (isMenuOpen || isMenuMounted) closeMenu()
    else openMenu()
  }

  useEffect(() => {
    if (!isMenuMounted || isMenuOpen) return
    const timer = window.setTimeout(() => {
      setIsMenuMounted(false)
      unlockBodyScroll()
      const next = afterCloseRef.current
      afterCloseRef.current = null
      if (next) {
        requestAnimationFrame(() => next())
      } else {
        openButtonRef.current?.focus()
      }
    }, 380)
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

  useEffect(
    () => () => {
      document.documentElement.classList.remove('mobile-nav-open')
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    },
    []
  )

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home') {
      if (location.pathname !== '/') navigate('/')
      window.setTimeout(
        () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        location.pathname !== '/' ? 120 : 0
      )
      return
    }
    const run = () => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    if (location.pathname !== '/') {
      navigate('/')
      window.setTimeout(run, 150)
    } else {
      run()
    }
  }

  const handleNavItem = (item: NavItem) => {
    closeMenu(() => {
      if (item.action === 'home') {
        navigate('/')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (item.action === 'section') {
        scrollToSection(item.target)
      } else {
        navigate(item.target)
      }
    })
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
      onClick={
        onNavigate ??
        (() => {
          closeMenu(() => {
            navigate('/')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          })
        })
      }
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
        className={`rn-mobile-nav fixed inset-0 z-[100] md:hidden bg-black ${isMenuOpen ? 'is-open' : ''}`}
        id="mobile-fullscreen-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <div className="rn-mobile-nav__panel absolute inset-0 bg-black flex flex-col min-h-[100dvh] h-[100dvh]">
          <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-gray-800/80 bg-black shrink-0">
            <BrandMark
              centered={false}
              onNavigate={() =>
                closeMenu(() => {
                  navigate('/')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                })
              }
            />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => closeMenu()}
              className="text-gray-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain bg-black px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <nav>
              <ul className="space-y-1">
                {NAV_ITEMS.map((item, index) => (
                  <li
                    key={item.id}
                    className="rn-mobile-nav__item"
                    style={{ transitionDelay: isMenuOpen ? `${60 + index * 35}ms` : '0ms' }}
                  >
                    <button
                      type="button"
                      onClick={() => handleNavItem(item)}
                      className="block w-full px-3 py-3 text-left text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase min-h-[48px]"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div
              className="rn-mobile-nav__item pt-6 mt-4 border-t border-gray-700 space-y-3"
              style={{ transitionDelay: isMenuOpen ? '320ms' : '0ms' }}
            >
              <a
                href="tel:+3584578345138"
                className="flex items-center justify-center space-x-2 text-sm text-gray-300 hover:text-emerald-400 min-h-[44px]"
              >
                <Phone size={16} />
                <span>+358 45 78345138</span>
              </a>
              <a
                href="mailto:contact@royalnordic.fi"
                className="flex items-center justify-center space-x-2 text-sm text-gray-300 hover:text-emerald-400 min-h-[44px]"
              >
                <Mail size={16} />
                <span>contact@royalnordic.fi</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-sm text-emerald-400 hover:text-emerald-300 min-h-[44px]"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div
              className="rn-mobile-nav__item flex items-center justify-center space-x-8 pt-4"
              style={{ transitionDelay: isMenuOpen ? '360ms' : '0ms' }}
            >
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-500 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Follow us on TikTok"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>

            <div
              className="rn-mobile-nav__item pt-6 space-y-3"
              style={{ transitionDelay: isMenuOpen ? '400ms' : '0ms' }}
            >
              <button
                type="button"
                onClick={() => handleNavItem(NAV_ITEMS.find((i) => i.id === 'partners')!)}
                className="w-full rounded-lg border border-gray-600 bg-transparent px-4 py-3 text-sm font-medium text-white hover:border-emerald-500/50 hover:text-emerald-300 transition-colors min-h-[48px]"
              >
                Become a Partner
              </button>
              <button
                type="button"
                onClick={() =>
                  closeMenu(() => {
                    navigate('/customized-tour')
                  })
                }
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors min-h-[48px]"
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
        className={`fixed left-0 right-0 z-50 w-full transition-all duration-500 ${
          isScrolled
            ? 'bg-black/95 backdrop-blur-xl shadow-2xl border-b border-gray-700'
            : 'bg-transparent'
        }`}
        style={{ top: 'var(--rn-promo-bar-height, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
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

          <div className="hidden md:flex justify-between items-center h-24 pt-1">
            <div className="flex-shrink-0 pl-2">
              <BrandMark
                onNavigate={() => {
                  navigate('/')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
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

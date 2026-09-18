import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { isHeroShell } from '../layout/shell'

type NavChild = { label: string; to: string; hint: string }

const EXPERIENCES: NavChild[] = [
  { label: 'Northern Lights', to: '/northern-lights-tours', hint: 'Aurora hunts & photography' },
  { label: 'Day Tours', to: '/daytime-experiences', hint: 'Arctic daytime experiences' },
  { label: 'Private & Custom', to: '/customized-tour', hint: 'Tailored Lapland itineraries' },
  { label: 'Transfers', to: '/transportation', hint: 'Private transportation' },
]

const NAV = [
  { label: 'Northern Lights', to: '/northern-lights-tours' },
  { label: 'Day Tours', to: '/daytime-experiences' },
  { label: 'Private & Custom', to: '/customized-tour' },
  { label: 'Transfers', to: '/transportation' },
  { label: 'Partner With Us', to: '/travel-trade' },
  { label: 'Contact', to: '/contact' },
]

const MOBILE_EXTRA = [
  { label: 'Partner With Us', to: '/travel-trade', hint: 'Travel trade & partnerships' },
  { label: 'Contact', to: '/contact', hint: 'Phone, email & enquiry form' },
]

function resolveNav(to: string, navigate: ReturnType<typeof useNavigate>, pathname: string) {
  if (to.startsWith('/#')) {
    const id = to.slice(2)
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    }
    return
  }
  navigate(to)
}

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [experiencesOpen, setExperiencesOpen] = useState(false)
  const [dropVisible, setDropVisible] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const closeRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const scrollLockY = useRef(0)
  const afterClose = useRef<(() => void) | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)
  const menuId = useId()

  const hasHero = isHeroShell(pathname)
  const transparent = hasHero && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useEffect(() => {
    setExperiencesOpen(false)
    setDropVisible(false)
  }, [pathname])

  const openExperiences = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setExperiencesOpen(true)
    requestAnimationFrame(() => setDropVisible(true))
  }

  const scheduleCloseExperiences = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setDropVisible(false)
    closeTimer.current = window.setTimeout(() => {
      setExperiencesOpen(false)
      closeTimer.current = null
    }, 220)
  }

  const closeExperiencesNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setDropVisible(false)
    setExperiencesOpen(false)
  }

  useEffect(() => {
    if (!experiencesOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) closeExperiencesNow()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeExperiencesNow()
      }
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [experiencesOpen])

  const lockScroll = useCallback(() => {
    scrollLockY.current = window.scrollY
    document.documentElement.classList.add('mobile-nav-open')
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollLockY.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
  }, [])

  const unlockScroll = useCallback(() => {
    document.documentElement.classList.remove('mobile-nav-open')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    window.scrollTo(0, scrollLockY.current)
  }, [])

  const openMenu = () => {
    setMenuMounted(true)
    lockScroll()
    requestAnimationFrame(() => requestAnimationFrame(() => setMenuOpen(true)))
  }

  const closeMenu = (next?: () => void) => {
    afterClose.current = next ?? null
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuMounted || menuOpen) return
    const t = window.setTimeout(() => {
      setMenuMounted(false)
      unlockScroll()
      const fn = afterClose.current
      afterClose.current = null
      if (fn) requestAnimationFrame(fn)
      else openRef.current?.focus()
    }, 340)
    return () => window.clearTimeout(t)
  }, [menuMounted, menuOpen, unlockScroll])

  useEffect(() => {
    if (!menuOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const go = (to: string) => {
    closeMenu(() => resolveNav(to, navigate, pathname))
  }

  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(to))

  return (
    <>
      <header
        className={`rn-header fixed left-0 right-0 z-50 ${
          transparent ? 'rn-header--transparent' : 'rn-header--solid'
        }`}
        style={{ top: 'var(--rn-promo-bar-height, 0px)' }}
      >
        <div className="rn-header__inner rn-container flex items-center justify-between gap-4">
          <Link to="/" className="rn-header__brand flex shrink-0 items-center" aria-label="Royal Nordic home">
            <img src="/logo.png" alt="" className="rn-header__brand-mark" width={26} height={26} />
            <span className="rn-header__brand-name">Royal Nordic</span>
          </Link>

          <div className="rn-header__cluster">
            <nav className="rn-header__nav" aria-label="Primary">
              <div
                className="rn-mega-wrap"
                ref={dropRef}
                onMouseEnter={openExperiences}
                onMouseLeave={scheduleCloseExperiences}
              >
                <button
                  type="button"
                  aria-expanded={experiencesOpen}
                  aria-haspopup="menu"
                  aria-controls={menuId}
                  onClick={() => (experiencesOpen ? scheduleCloseExperiences() : openExperiences())}
                  className={`rn-nav-link inline-flex items-center ${
                    experiencesOpen || EXPERIENCES.some((c) => isActive(c.to)) ? 'rn-nav-link--active' : ''
                  }`}
                >
                  Experiences
                  <ChevronDown size={14} className="rn-nav-link__chevron" aria-hidden strokeWidth={1.75} />
                </button>

                {experiencesOpen && (
                  <div
                    id={menuId}
                    role="menu"
                    className={`rn-mega ${dropVisible ? 'rn-mega--open' : ''}`}
                  >
                    <p className="rn-mega__label">Experiences</p>
                    <ul className="rn-mega__list">
                      {EXPERIENCES.map((child) => (
                        <li key={child.to}>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              closeExperiencesNow()
                              resolveNav(child.to, navigate, pathname)
                            }}
                            className={`rn-mega__item ${isActive(child.to) ? 'rn-mega__item--active' : ''}`}
                          >
                            <span className="rn-mega__item-main">
                              <span className="rn-mega__item-title">{child.label}</span>
                              <span className="rn-mega__item-hint">{child.hint}</span>
                            </span>
                            <span className="rn-mega__item-arrow" aria-hidden>
                              →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {NAV.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => resolveNav(item.to, navigate, pathname)}
                  className={`rn-nav-link ${isActive(item.to) ? 'rn-nav-link--active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <Link to="/northern-lights-tour" className="rn-header-cta hidden sm:inline-flex">
              Book a tour
            </Link>
            <button
              ref={openRef}
              type="button"
              className="rn-header-menu"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => (menuOpen || menuMounted ? closeMenu() : openMenu())}
            >
              {menuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      {menuMounted &&
        createPortal(
          <div
            className={`rn-mobile-drawer fixed inset-0 z-[70] xl:hidden ${menuOpen ? 'rn-mobile-drawer--open' : ''}`}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="rn-mobile-drawer__backdrop"
              aria-label="Close menu"
              onClick={() => closeMenu()}
            />
            <div className={`rn-mobile-drawer__panel ${menuOpen ? 'is-open' : ''}`}>
              <div className="rn-mobile-drawer__head">
                <span className="font-display text-lg tracking-wide text-white/95">Menu</span>
                <button
                  ref={closeRef}
                  type="button"
                  className="rn-mobile-drawer__close"
                  aria-label="Close menu"
                  onClick={() => closeMenu()}
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
              <nav className="rn-mobile-drawer__nav" aria-label="Mobile">
                <p className="rn-mobile-drawer__label">Experiences</p>
                {EXPERIENCES.map((item, i) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className={`rn-mobile-drawer__link ${isActive(item.to) ? 'rn-mobile-drawer__link--active' : ''}`}
                    style={{ '--rn-drawer-i': i } as React.CSSProperties}
                  >
                    <span className="rn-mobile-drawer__link-title">{item.label}</span>
                    <span className="rn-mobile-drawer__link-hint">{item.hint}</span>
                  </button>
                ))}
                <div className="rn-mobile-drawer__rule" aria-hidden />
                {MOBILE_EXTRA.map((item, i) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className={`rn-mobile-drawer__link rn-mobile-drawer__link--solo ${
                      isActive(item.to) ? 'rn-mobile-drawer__link--active' : ''
                    }`}
                    style={{ '--rn-drawer-i': EXPERIENCES.length + i } as React.CSSProperties}
                  >
                    <span className="rn-mobile-drawer__link-title">{item.label}</span>
                    <span className="rn-mobile-drawer__link-hint">{item.hint}</span>
                  </button>
                ))}
              </nav>
              <div className="rn-mobile-drawer__foot">
                <Link
                  to="/northern-lights-tour"
                  onClick={() => closeMenu()}
                  className="rn-header-cta rn-header-cta--drawer"
                >
                  Book a tour
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default Header

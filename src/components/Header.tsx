import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { isHeroShell } from '../layout/shell'

type NavChild = { label: string; to: string; hint: string }

const EXPERIENCES: NavChild[] = [
  { label: 'Northern Lights', to: '/northern-lights-tours', hint: 'Aurora hunts & pro photos' },
  { label: 'Day Tours', to: '/daytime-experiences', hint: 'Arctic daytime experiences' },
  { label: 'Private & Custom', to: '/customized-tour', hint: 'Tailored Lapland itineraries' },
  { label: 'Transfers', to: '/transportation', hint: 'Saariselkä, Levi & custom routes' },
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
  /** closed → opening/open → closing → unmount */
  const [menuPhase, setMenuPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const [experiencesOpen, setExperiencesOpen] = useState(false)
  const [dropVisible, setDropVisible] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const closeRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const afterClose = useRef<(() => void) | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLButtonElement>(null)
  const panelAnim = useRef<Animation | null>(null)
  const backdropAnim = useRef<Animation | null>(null)
  const menuGen = useRef(0)
  const closeTimer = useRef<number | null>(null)
  const menuId = useId()
  const MENU_MS = 300
  const MENU_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
  const menuMounted = menuPhase !== 'closed'
  const menuOpen = menuPhase === 'open'
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
    const sbw = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.classList.add('mobile-nav-open')
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (sbw > 0) {
      document.body.style.paddingRight = `${sbw}px`
      document.documentElement.style.setProperty('--rn-scrollbar-comp', `${sbw}px`)
    }
  }, [])

  const unlockScroll = useCallback(() => {
    document.documentElement.classList.remove('mobile-nav-open')
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.documentElement.style.removeProperty('--rn-scrollbar-comp')
  }, [])

  const cancelMenuAnims = () => {
    panelAnim.current?.cancel()
    backdropAnim.current?.cancel()
    panelAnim.current = null
    backdropAnim.current = null
  }

  const slidePanel = (toOpen: boolean) => {
    const panel = panelRef.current
    const backdrop = backdropRef.current
    if (!panel || !backdrop) return Promise.resolve()

    // Commit current animated values, then cancel — so reverse mid-slide doesn't jump.
    const matrix = new DOMMatrix(getComputedStyle(panel).transform)
    const fromX = matrix.m41
    const fromOp = Number(getComputedStyle(backdrop).opacity) || 0
    cancelMenuAnims()

    const duration = reduceMotion ? 0 : MENU_MS
    const width = panel.offsetWidth || panel.getBoundingClientRect().width
    const toX = toOpen ? 0 : width
    const toOp = toOpen ? 1 : 0

    panel.style.transform = `translate3d(${fromX}px, 0, 0)`
    backdrop.style.opacity = String(fromOp)

    panelAnim.current = panel.animate(
      [
        { transform: `translate3d(${fromX}px, 0, 0)` },
        { transform: `translate3d(${toX}px, 0, 0)` },
      ],
      { duration, easing: MENU_EASE, fill: 'forwards' }
    )
    backdropAnim.current = backdrop.animate(
      [{ opacity: fromOp }, { opacity: toOp }],
      { duration, easing: 'ease', fill: 'forwards' }
    )

    panelAnim.current.finished
      .then(() => {
        panel.style.transform = `translate3d(${toX}px, 0, 0)`
      })
      .catch(() => undefined)
    backdropAnim.current.finished
      .then(() => {
        backdrop.style.opacity = String(toOp)
      })
      .catch(() => undefined)

    return Promise.all([
      panelAnim.current.finished.catch(() => undefined),
      backdropAnim.current.finished.catch(() => undefined),
    ]).then(() => undefined)
  }

  const finishClose = (gen: number) => {
    if (gen !== menuGen.current) return
    cancelMenuAnims()
    if (panelRef.current) panelRef.current.style.transform = ''
    if (backdropRef.current) backdropRef.current.style.opacity = ''
    setMenuPhase('closed')
    unlockScroll()
    const fn = afterClose.current
    afterClose.current = null
    if (fn) requestAnimationFrame(fn)
    else openRef.current?.focus()
  }

  const openMenu = () => {
    if (menuPhase === 'open') return
    afterClose.current = null
    menuGen.current += 1
    lockScroll()
    setMenuPhase('open')
  }

  const closeMenu = (next?: () => void) => {
    if (menuPhase === 'closed') return
    if (next) afterClose.current = next
    else if (menuPhase !== 'closing') afterClose.current = null
    if (menuPhase === 'closing') return
    const gen = (menuGen.current += 1)
    setMenuPhase('closing')
    void slidePanel(false).then(() => finishClose(gen))
  }

  // Slide in after the drawer is mounted (refs ready); always from the right edge.
  useEffect(() => {
    if (menuPhase !== 'open') return
    const id = window.requestAnimationFrame(() => void slidePanel(true))
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuPhase])

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
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => (menuPhase === 'open' ? closeMenu() : openMenu())}
            >
              {menuPhase === 'closed' ? (
                <Menu size={20} strokeWidth={1.75} />
              ) : (
                <X size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </header>

      {menuMounted &&
        createPortal(
          <div
            className={`rn-mobile-drawer fixed inset-0 z-[70] xl:hidden${
              menuOpen ? ' rn-mobile-drawer--open' : ''
            }`}
            role="dialog"
            aria-modal="true"
          >
            <button
              ref={backdropRef}
              type="button"
              className="rn-mobile-drawer__backdrop"
              aria-label="Close menu"
              onClick={() => closeMenu()}
            />
            <div ref={panelRef} className="rn-mobile-drawer__panel">
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
                {EXPERIENCES.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className={`rn-mobile-drawer__link ${isActive(item.to) ? 'rn-mobile-drawer__link--active' : ''}`}
                  >
                    <span className="rn-mobile-drawer__link-title">{item.label}</span>
                    <span className="rn-mobile-drawer__link-hint">{item.hint}</span>
                  </button>
                ))}
                <div className="rn-mobile-drawer__rule" aria-hidden />
                {MOBILE_EXTRA.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className={`rn-mobile-drawer__link rn-mobile-drawer__link--solo ${
                      isActive(item.to) ? 'rn-mobile-drawer__link--active' : ''
                    }`}
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

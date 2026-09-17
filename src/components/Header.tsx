import { useCallback, useEffect, useId, useRef, useState } from 'react'
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
    }, 160)
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
    }, 260)
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
        <div className="rn-container flex h-[3.75rem] items-center justify-between gap-4 sm:h-16">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Royal Nordic home">
            <img src="/logo.png" alt="" className="h-7 w-auto sm:h-8" width={32} height={32} />
            <span className="font-display text-[1.05rem] font-semibold tracking-wide text-white sm:text-xl">
              Royal Nordic
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            <div
              className="relative"
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
                className={`rn-nav-link inline-flex items-center gap-1 ${
                  experiencesOpen || EXPERIENCES.some((c) => isActive(c.to)) ? 'rn-nav-link--active' : ''
                }`}
              >
                Experiences
                <ChevronDown
                  size={13}
                  className={`transition duration-200 ${experiencesOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
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

          <div className="flex items-center gap-2">
            <Link to="/northern-lights-tour" className="rn-btn-primary rn-btn-nav hidden sm:inline-flex">
              Book a tour
            </Link>
            <button
              ref={openRef}
              type="button"
              className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded border border-white/15 text-white xl:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => (menuOpen || menuMounted ? closeMenu() : openMenu())}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {menuMounted &&
        createPortal(
          <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${
                menuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label="Close menu"
              onClick={() => closeMenu()}
            />
            <div
              className={`absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-white/[0.08] bg-[#030706] transition-transform duration-300 ${
                menuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <span className="font-display text-xl text-white">Menu</span>
                <button
                  ref={closeRef}
                  type="button"
                  className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded border border-white/15 text-white"
                  aria-label="Close menu"
                  onClick={() => closeMenu()}
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-4" aria-label="Mobile">
                <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-aurora-soft/80">
                  Experiences
                </p>
                {EXPERIENCES.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className="rounded px-4 py-3 text-left"
                  >
                    <span className="block text-base font-medium text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-text-dim">{item.hint}</span>
                  </button>
                ))}
                <div className="my-3 mx-4 border-t border-white/[0.08]" />
                <button
                  type="button"
                  onClick={() => go('/travel-trade')}
                  className={`rounded px-4 py-3.5 text-left text-base font-medium ${
                    isActive('/travel-trade') ? 'text-aurora-soft' : 'text-white'
                  }`}
                >
                  Partner With Us
                </button>
              </nav>
              <div className="border-t border-white/[0.08] p-4">
                <Link to="/northern-lights-tour" onClick={() => closeMenu()} className="rn-btn-primary w-full">
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

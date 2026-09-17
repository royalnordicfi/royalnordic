import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

type NavItem = {
  label: string
  to: string
}

const NAV: NavItem[] = [
  { label: 'Experiences', to: '/#experiences' },
  { label: 'Northern Lights', to: '/northern-lights-tours' },
  { label: 'Day Tours', to: '/daytime-experiences' },
  { label: 'Private & Custom', to: '/customized-tour' },
  { label: 'Transfers', to: '/transportation' },
  { label: 'Guides', to: '/blog' },
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
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const closeRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const scrollLockY = useRef(0)
  const afterClose = useRef<(() => void) | null>(null)

  const isHome = pathname === '/'
  const overHero = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    }, 280)
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

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          overHero
            ? 'bg-transparent'
            : 'border-b border-white/10 bg-midnight/95 backdrop-blur-md'
        }`}
        style={{ top: 'var(--rn-promo-bar-height, 0px)' }}
      >
        <div className="rn-container flex h-[4.25rem] items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Royal Nordic home">
            <img src="/logo.png" alt="" className="h-8 w-auto" width={32} height={32} />
            <span className="font-display text-lg font-semibold tracking-wide text-snow sm:text-xl">
              Royal Nordic
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => resolveNav(item.to, navigate, pathname)}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-snow/85 transition hover:bg-white/10 hover:text-snow"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/northern-lights-tour"
              className="rn-btn-primary hidden px-5 py-2.5 text-xs sm:inline-flex"
            >
              Book a tour
            </Link>
            <button
              ref={openRef}
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 text-snow xl:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => (menuOpen || menuMounted ? closeMenu() : openMenu())}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuMounted &&
        createPortal(
          <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className={`absolute inset-0 bg-midnight/70 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
              aria-label="Close menu"
              onClick={() => closeMenu()}
            />
            <div
              className={`absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col bg-midnight-soft shadow-2xl transition-transform duration-300 ${
                menuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="font-display text-xl text-snow">Menu</span>
                <button
                  ref={closeRef}
                  type="button"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 text-snow"
                  aria-label="Close menu"
                  onClick={() => closeMenu()}
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
                {NAV.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => go(item.to)}
                    className="rounded-rn px-4 py-3.5 text-left text-base font-medium text-snow hover:bg-white/5"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="border-t border-white/10 p-4">
                <Link
                  to="/northern-lights-tour"
                  onClick={() => closeMenu()}
                  className="rn-btn-primary w-full"
                >
                  Book Guaranteed Northern Lights
                </Link>
                <Link
                  to="/travel-trade"
                  onClick={() => closeMenu()}
                  className="mt-3 block text-center text-sm text-snow/60 hover:text-snow"
                >
                  Travel trade / partners
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

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { isHeroShell } from '../layout/shell'

type NavItem = {
  label: string
  to: string
  children?: { label: string; to: string; hint?: string }[]
}

const NAV: NavItem[] = [
  {
    label: 'Experiences',
    to: '/#experiences',
    children: [
      { label: 'Northern Lights', to: '/northern-lights-tours', hint: 'Aurora hunts' },
      { label: 'Day Tours', to: '/daytime-experiences', hint: 'Day adventures' },
      { label: 'Private & Custom', to: '/customized-tour', hint: 'Tailored' },
      { label: 'Transfers', to: '/transportation', hint: 'Private transport' },
    ],
  },
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
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const closeRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const scrollLockY = useRef(0)
  const afterClose = useRef<(() => void) | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const hasHero = isHeroShell(pathname)
  const transparent = hasHero && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useEffect(() => {
    setExperiencesOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!experiencesOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setExperiencesOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
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

  const isActive = (to: string) => {
    if (to === '/#experiences') return false
    return pathname === to || (to !== '/' && pathname.startsWith(to))
  }

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 transition-[background,border,box-shadow,backdrop-filter] duration-300 ${
          transparent
            ? 'border-b border-transparent bg-gradient-to-b from-black/55 to-transparent'
            : 'border-b border-white/[0.07] bg-[#050a10]/88 backdrop-blur-xl shadow-[0_1px_0_0_rgba(18,185,129,0.08)]'
        }`}
        style={{ top: 'var(--rn-promo-bar-height, 0px)' }}
      >
        <div className="rn-container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Royal Nordic home">
            <img src="/logo.png" alt="" className="h-8 w-auto" width={32} height={32} />
            <span className="font-display text-lg font-semibold tracking-wide text-white sm:text-xl">
              Royal Nordic
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            {NAV.map((item) => {
              if (item.children) {
                return (
                  <div key={item.label} className="relative" ref={dropRef}>
                    <button
                      type="button"
                      aria-expanded={experiencesOpen}
                      aria-haspopup="true"
                      onClick={() => setExperiencesOpen((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium transition ${
                        experiencesOpen || item.children.some((c) => isActive(c.to))
                          ? 'text-aurora-soft'
                          : 'text-white/78 hover:text-white'
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition ${experiencesOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {experiencesOpen && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-md border border-white/10 bg-[#0b121a]/96 p-1.5 shadow-rn backdrop-blur-xl">
                        {item.children.map((child) => (
                          <button
                            key={child.to}
                            type="button"
                            onClick={() => {
                              setExperiencesOpen(false)
                              resolveNav(child.to, navigate, pathname)
                            }}
                            className={`flex w-full flex-col rounded-md px-3 py-2.5 text-left transition hover:bg-white/5 ${
                              isActive(child.to) ? 'bg-white/[0.04]' : ''
                            }`}
                          >
                            <span className="text-sm font-medium text-white">{child.label}</span>
                            {child.hint && (
                              <span className="text-xs text-text-dim">{child.hint}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => resolveNav(item.to, navigate, pathname)}
                  className={`rounded-md px-3 py-2 text-[13px] font-medium transition ${
                    isActive(item.to)
                      ? 'text-aurora-soft'
                      : 'text-white/78 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/northern-lights-tour"
              className="rn-btn-primary hidden !min-h-0 !px-4 !py-2 text-xs sm:inline-flex"
            >
              Book a tour
            </Link>
            <button
              ref={openRef}
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-white/15 text-white xl:hidden"
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
              className={`absolute inset-0 bg-black/75 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
              aria-label="Close menu"
              onClick={() => closeMenu()}
            />
            <div
              className={`absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col border-l border-white/10 bg-[#050a10] transition-transform duration-300 ${
                menuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="font-display text-xl text-white">Menu</span>
                <button
                  ref={closeRef}
                  type="button"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-white/15 text-white"
                  aria-label="Close menu"
                  onClick={() => closeMenu()}
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-5" aria-label="Mobile">
                {NAV.filter((item) => !item.children).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => go(item.to)}
                    className={`rounded-md px-4 py-3.5 text-left text-lg font-medium transition ${
                      isActive(item.to) ? 'text-aurora-soft' : 'text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => go('/#experiences')}
                  className="rounded-md px-4 py-3.5 text-left text-lg font-medium text-white hover:bg-white/5"
                >
                  All experiences
                </button>
              </nav>
              <div className="border-t border-white/10 p-4">
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

import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="relative border-t border-white/[0.08] bg-[#030706] text-snow">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora/25 to-transparent" aria-hidden />
      <div className="rn-container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-7 w-auto" width={28} height={28} />
              <span className="font-display text-lg font-semibold tracking-wide">Royal Nordic</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              Small-group Lapland experiences from Rovaniemi — Northern Lights, day tours, and private
              itineraries.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
              Experiences
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link className="transition hover:text-aurora-soft" to="/northern-lights-tours">Northern Lights</Link></li>
              <li><Link className="transition hover:text-aurora-soft" to="/northern-lights-tour">Guaranteed Northern Lights</Link></li>
              <li><Link className="transition hover:text-aurora-soft" to="/daytime-experiences">Day Tours</Link></li>
              <li><Link className="transition hover:text-aurora-soft" to="/customized-tour">Private &amp; Custom</Link></li>
              <li><Link className="transition hover:text-aurora-soft" to="/transportation">Transfers</Link></li>
              <li><Link className="transition hover:text-aurora-soft" to="/blog">Travel guides</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link className="transition hover:text-aurora-soft" to="/#contact">Contact</Link></li>
              <li><Link className="transition hover:text-aurora-soft" to="/travel-trade">Partner With Us</Link></li>
              <li><a className="transition hover:text-aurora-soft" href="mailto:contact@royalnordic.fi">contact@royalnordic.fi</a></li>
              <li><a className="transition hover:text-aurora-soft" href="tel:+3584578345138">+358 45 78345138</a></li>
              <li>Rovaniemi, Lapland</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
              Follow
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <a className="transition hover:text-aurora-soft" href="https://www.instagram.com/royalnordic.fi/" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a className="transition hover:text-aurora-soft" href="https://www.tiktok.com/@royalnordic" target="_blank" rel="noreferrer">
                  TikTok
                </a>
              </li>
            </ul>
            <div className="mt-5 space-y-1.5 text-sm text-text-dim">
              <Link className="block transition hover:text-aurora-soft" to="/privacy-policy">Privacy Policy</Link>
              <Link className="block transition hover:text-aurora-soft" to="/terms-conditions">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.08] pt-5 text-xs text-text-dim">
          © {new Date().getFullYear()} Royal Nordic
        </div>
      </div>
    </footer>
  )
}

export default Footer

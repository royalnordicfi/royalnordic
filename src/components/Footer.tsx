import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#030706] text-snow">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora/15 to-transparent" aria-hidden />
      <div className="rn-container py-8 sm:py-10">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-6 w-auto opacity-90" width={24} height={24} />
              <span className="font-display text-base font-semibold tracking-wide text-white/95">Royal Nordic</span>
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-text-muted">
              Small-group Lapland experiences from Rovaniemi — aurora hunts, day tours, and private itineraries.
            </p>
          </div>

          <div>
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Experiences
            </h3>
            <ul className="space-y-1.5 text-[13px]">
              <li><Link className="rn-footer-link" to="/northern-lights-tours">Northern Lights</Link></li>
              <li><Link className="rn-footer-link" to="/northern-lights-tour">Guaranteed Northern Lights</Link></li>
              <li><Link className="rn-footer-link" to="/daytime-experiences">Day Tours</Link></li>
              <li><Link className="rn-footer-link" to="/customized-tour">Private &amp; Custom</Link></li>
              <li><Link className="rn-footer-link" to="/transportation">Transfers</Link></li>
              <li><Link className="rn-footer-link" to="/blog">Travel guides</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Company
            </h3>
            <ul className="space-y-1.5 text-[13px]">
              <li><Link className="rn-footer-link" to="/#contact">Contact</Link></li>
              <li><Link className="rn-footer-link" to="/travel-trade">Partner With Us</Link></li>
              <li><a className="rn-footer-link" href="mailto:contact@royalnordic.fi">contact@royalnordic.fi</a></li>
              <li><a className="rn-footer-link" href="tel:+3584578345138">+358 45 78345138</a></li>
              <li className="text-text-dim">Rovaniemi, Lapland</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Follow
            </h3>
            <ul className="space-y-1.5 text-[13px]">
              <li>
                <a className="rn-footer-link" href="https://www.instagram.com/royalnordic.fi/" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a className="rn-footer-link" href="https://www.tiktok.com/@royalnordic" target="_blank" rel="noreferrer">
                  TikTok
                </a>
              </li>
            </ul>
            <div className="mt-4 space-y-1 text-[13px]">
              <Link className="rn-footer-link block" to="/privacy-policy">Privacy Policy</Link>
              <Link className="rn-footer-link block" to="/terms-conditions">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-white/[0.06] pt-4 text-[11px] text-text-dim">
          © {new Date().getFullYear()} Royal Nordic
        </div>
      </div>
    </footer>
  )
}

export default Footer

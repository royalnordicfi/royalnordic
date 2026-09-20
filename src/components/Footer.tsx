import { Link } from 'react-router-dom'
import { CONTACT } from '../lib/contactInfo'

const Footer = () => {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#030706] text-snow">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora/15 to-transparent" aria-hidden />
      <div className="rn-container py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="mb-3.5 flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-7 w-auto opacity-95" width={28} height={28} />
              <span className="font-display text-xl font-semibold tracking-[0.02em] text-white/96">Royal Nordic</span>
            </div>
            <p className="max-w-xs text-[13.5px] leading-relaxed text-text-muted">
              Small-group Lapland experiences from Rovaniemi — aurora hunts, day tours, and private
              itineraries, guided by locals who know the sky.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Experiences
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><Link className="rn-footer-link" to="/northern-lights-tours">Northern Lights</Link></li>
              <li><Link className="rn-footer-link" to="/northern-lights-tour">Guaranteed Northern Lights</Link></li>
              <li><Link className="rn-footer-link" to="/daytime-experiences">Day Tours</Link></li>
              <li><Link className="rn-footer-link" to="/customized-tour">Private &amp; Custom</Link></li>
              <li><Link className="rn-footer-link" to="/transportation">Transfers</Link></li>
              <li><Link className="rn-footer-link" to="/blog">Travel guides</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Company
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><Link className="rn-footer-link" to="/contact">Contact</Link></li>
              <li><Link className="rn-footer-link" to="/travel-trade">Partner With Us</Link></li>
              <li>
                <a className="rn-footer-link" href={CONTACT.emailHref}>
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a className="rn-footer-link" href={CONTACT.phoneHref}>
                  {CONTACT.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Follow
            </h3>
            <ul className="space-y-2 text-[13px]">
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
          </div>
        </div>

        <div className="mt-11 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[11.5px] text-text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Royal Nordic · Rovaniemi, Finnish Lapland</p>
          <div className="flex items-center gap-5">
            <Link className="rn-footer-link" to="/privacy-policy">Privacy Policy</Link>
            <Link className="rn-footer-link" to="/terms-conditions">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

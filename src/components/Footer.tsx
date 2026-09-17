import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black text-snow">
      <div className="rn-container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-7 w-auto" width={28} height={28} />
              <span className="font-display text-lg font-semibold">Royal Nordic</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              Small-group Lapland experiences from Rovaniemi.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Experiences</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link className="hover:text-white" to="/northern-lights-tours">Northern Lights</Link></li>
              <li><Link className="hover:text-white" to="/northern-lights-tour">Guaranteed Northern Lights</Link></li>
              <li><Link className="hover:text-white" to="/daytime-experiences">Day Tours</Link></li>
              <li><Link className="hover:text-white" to="/customized-tour">Private &amp; Custom</Link></li>
              <li><Link className="hover:text-white" to="/transportation">Transfers</Link></li>
              <li><Link className="hover:text-white" to="/blog">Travel guides</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link className="hover:text-white" to="/#contact">Contact</Link></li>
              <li><Link className="hover:text-white" to="/travel-trade">Partner With Us</Link></li>
              <li><a className="hover:text-white" href="mailto:contact@royalnordic.fi">contact@royalnordic.fi</a></li>
              <li><a className="hover:text-white" href="tel:+3584578345138">+358 45 78345138</a></li>
              <li>Rovaniemi, Lapland</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Follow</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <a className="hover:text-white" href="https://www.instagram.com/royalnordic.fi/" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="https://www.tiktok.com/@royalnordic" target="_blank" rel="noreferrer">
                  TikTok
                </a>
              </li>
            </ul>
            <div className="mt-5 space-y-1.5 text-sm text-text-dim">
              <Link className="block hover:text-white" to="/privacy-policy">Privacy Policy</Link>
              <Link className="block hover:text-white" to="/terms-conditions">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-text-dim">
          © {new Date().getFullYear()} Royal Nordic
        </div>
      </div>
    </footer>
  )
}

export default Footer

import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-midnight text-snow">
      <div className="rn-container py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-8 w-auto" width={32} height={32} />
              <span className="font-display text-xl font-semibold">Royal Nordic</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-snow/65">
              Small-group Lapland experiences from Rovaniemi — Northern Lights, day adventures,
              private itineraries, and transfers.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-display text-lg">Experiences</h3>
            <ul className="space-y-2.5 text-sm text-snow/70">
              <li><Link className="hover:text-snow" to="/northern-lights-tours">Northern Lights</Link></li>
              <li><Link className="hover:text-snow" to="/northern-lights-tour">Guaranteed Northern Lights</Link></li>
              <li><Link className="hover:text-snow" to="/daytime-experiences">Day Tours</Link></li>
              <li><Link className="hover:text-snow" to="/customized-tour">Private &amp; Custom</Link></li>
              <li><Link className="hover:text-snow" to="/transportation">Transfers</Link></li>
              <li><Link className="hover:text-snow" to="/blog">Guides</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-lg">Company</h3>
            <ul className="space-y-2.5 text-sm text-snow/70">
              <li><Link className="hover:text-snow" to="/#about">About</Link></li>
              <li><Link className="hover:text-snow" to="/#contact">Contact</Link></li>
              <li><Link className="hover:text-snow" to="/travel-trade">Travel Trade</Link></li>
              <li><a className="hover:text-snow" href="mailto:contact@royalnordic.fi">contact@royalnordic.fi</a></li>
              <li><a className="hover:text-snow" href="tel:+3584578345138">+358 45 78345138</a></li>
              <li className="text-snow/55">Rovaniemi, Lapland, Finland</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-lg">Follow</h3>
            <ul className="space-y-2.5 text-sm text-snow/70">
              <li>
                <a className="hover:text-snow" href="https://www.instagram.com/royalnordic.fi/" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a className="hover:text-snow" href="https://www.tiktok.com/@royalnordic" target="_blank" rel="noreferrer">
                  TikTok
                </a>
              </li>
            </ul>
            <div className="mt-8 space-y-2 text-sm text-snow/55">
              <Link className="block hover:text-snow" to="/privacy-policy">Privacy Policy</Link>
              <Link className="block hover:text-snow" to="/terms-conditions">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-snow/45">
          © {new Date().getFullYear()} Royal Nordic. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer

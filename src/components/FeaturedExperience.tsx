import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { isTourPubliclyActive } from '../lib/productVisibility'
import { GUARANTEED_NL_CATALOG_ADULT_PRICE } from '../seo/guaranteedNorthernLightsTour'

const HIGHLIGHTS = [
  'Northern Lights guarantee (see Terms)',
  'Small group — max 8 per vehicle',
  'Hotel pickup in Rovaniemi',
  'Flexible duration based on forecasts',
  'English & Finnish guides',
  'Photography guidance included',
]

const FeaturedExperience = () => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    isTourPubliclyActive(1).then(setVisible)
  }, [])

  if (!visible) return null

  return (
    <section id="featured-experience" className="rn-section-dark" aria-labelledby="featured-nl-heading">
      <div className="rn-container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Link
            to="/northern-lights-tour"
            className="rn-card-photo aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
            aria-label="View Guaranteed Northern Lights Tour"
          >
            <img
              src="/nortti1.jpg"
              alt="Guests watching the Northern Lights on a Royal Nordic aurora tour"
              width={1200}
              height={1500}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight/50 via-transparent to-transparent" />
          </Link>

          <div>
            <p className="rn-eyebrow">Signature experience</p>
            <h2 id="featured-nl-heading" className="mt-3 font-display text-3xl font-semibold text-snow sm:text-4xl lg:text-5xl">
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-snow/75 sm:text-lg">
              Chase clearer skies from Rovaniemi with a small group, hotel pickup, and a Northern
              Lights guarantee — free return trip if no lights appear (see Terms).
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
              <div>
                <dt className="text-snow/45">From</dt>
                <dd className="mt-0.5 text-xl font-semibold text-snow">€{GUARANTEED_NL_CATALOG_ADULT_PRICE}</dd>
              </div>
              <div>
                <dt className="text-snow/45">Duration</dt>
                <dd className="mt-0.5 text-snow">2–12 h (typically ~6h)</dd>
              </div>
              <div>
                <dt className="text-snow/45">Group</dt>
                <dd className="mt-0.5 text-snow">Max 8 / vehicle</dd>
              </div>
              <div>
                <dt className="text-snow/45">Pickup</dt>
                <dd className="mt-0.5 text-snow">Rovaniemi area</dd>
              </div>
            </dl>

            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-snow/80">
                  <span className="mt-0.5 text-aurora">
                    <Check size={16} strokeWidth={2.5} aria-hidden />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/northern-lights-tour" className="rn-btn-primary px-8">
                Book now
              </Link>
              <Link to="/northern-lights-tour#book" className="rn-btn-secondary px-8">
                Check availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience

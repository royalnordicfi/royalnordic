import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

const HIGHLIGHTS = [
  'Northern Lights Guarantee',
  'Professional Photos Included',
  'Local Expert Guide',
  'Hotel Pickup & Drop-off',
  'Small Groups',
  'Flexible Aurora Hunting Locations',
]

const FeaturedExperience = () => {
  return (
    <section
      id="featured-experience"
      className="relative bg-black py-12 sm:py-16 lg:py-20"
      aria-labelledby="featured-experience-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <Link
            to="/northern-lights-tour"
            className="group relative block overflow-hidden rounded-2xl"
            aria-label="View Guaranteed Northern Lights Tour"
          >
            <div className="aspect-[4/3] w-full overflow-hidden sm:aspect-[16/11] lg:aspect-[5/4]">
              <img
                src="/nortti1.jpg"
                alt="Guests watching the Northern Lights on our Guaranteed Northern Lights Tour in Lapland"
                width={1200}
                height={960}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/35 via-transparent to-transparent"
              aria-hidden
            />
          </Link>

          <div className="flex flex-col justify-center">
            <p className="mb-3 font-clean text-xs font-medium uppercase tracking-[0.22em] text-emerald-400 sm:text-sm">
              Our Signature Experience
            </p>
            <h2
              id="featured-experience-heading"
              className="mb-4 font-luxury text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]"
            >
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mb-8 max-w-xl font-clean text-base leading-relaxed text-gray-300 sm:text-lg">
              Experience the magic of Lapland with our signature Northern Lights tour. Our
              experienced local guides continuously monitor weather and aurora forecasts to maximize
              your chances of witnessing the Northern Lights. Professional photography, small groups,
              hotel pickup, and our Northern Lights Guarantee make this our most requested experience.
            </p>

            <ul className="mb-9 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 font-clean text-sm text-gray-200 sm:text-base"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check size={13} strokeWidth={2.5} aria-hidden />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div>
              <Link
                to="/northern-lights-tour"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-10 py-3.5 font-elegant text-base font-bold tracking-widest text-white shadow-xl transition-all duration-300 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 sm:w-auto sm:text-lg"
              >
                BOOK NOW
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience

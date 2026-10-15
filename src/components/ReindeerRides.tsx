import Footer from './Footer'
import BokunProductList from './bokun/BokunProductList'

/**
 * Temporary atmosphere photography — no dedicated reindeer assets in the repo yet.
 * Replace with licensed Santa Claus Village / reindeer images before commercial launch.
 */
const HERO_IMAGE = '/snowshoe3.jpg'
const INTRO_IMAGE = '/korouoma1.jpg'
const GALLERY = [
  { src: '/nordicci6.jpg', alt: 'Winter light in Finnish Lapland (temporary atmosphere photo)' },
  { src: '/snowshoe4.jpg', alt: 'Snowy Lapland forest trail (temporary atmosphere photo)' },
  { src: '/ranua1.jpg', alt: 'Arctic wildlife landscape near Rovaniemi (temporary atmosphere photo)' },
]

const scrollToBook = () => {
  document.getElementById('reindeer-book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Visual prototype: Santa Claus Reindeer Bókun product-list inside Royal Nordic design.
 * Not linked from main nav — review via /reindeer-rides only.
 */
const ReindeerRides = () => {
  return (
    <div className="rn-page bg-[#f7f6f3] text-[#121816]">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-[#0a100e] sm:min-h-[78vh]">
        <img
          src={HERO_IMAGE}
          alt="Snowy Lapland landscape near Rovaniemi"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/25"
          aria-hidden
        />
        <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-32 sm:h-40" aria-hidden />

        <div className="rn-container relative z-10 w-full pb-12 pt-[calc(var(--rn-chrome-h)+2.5rem)] sm:pb-16 sm:pt-[calc(var(--rn-chrome-h)+3rem)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Santa Claus Village · Rovaniemi
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-[3rem] lg:text-[3.45rem]">
            Reindeer Rides in Rovaniemi
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/78 sm:text-[17px]">
            Experience the magic of Lapland.
          </p>
          <button
            type="button"
            onClick={scrollToBook}
            className="rn-btn-primary mt-8 min-h-[48px] px-8"
          >
            Explore Reindeer Rides
          </button>
        </div>
      </section>

      {/* Intro */}
      <section className="rn-section border-b border-black/[0.06] bg-[#f7f6f3]">
        <div className="rn-container">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6">
              <p className="rn-eyebrow !text-[#5c6b63]">Discover</p>
              <h2 className="mt-2.5 font-display text-[1.75rem] font-semibold tracking-tight text-[#121816] sm:text-[2.1rem]">
                Discover Reindeer Experiences
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#4a5750] sm:text-[16px]">
                Quiet forest trails, soft snow, and traditional reindeer rides near Santa Claus
                Village — choose an experience below and book directly with our partner.
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-[var(--rn-radius-md)] border border-black/[0.06]">
                <img
                  src={INTRO_IMAGE}
                  alt="Snow-covered Lapland forest (temporary atmosphere photo)"
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section
        id="reindeer-book"
        className="rn-section scroll-mt-24 bg-white"
        aria-labelledby="reindeer-book-heading"
      >
        <div className="rn-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="rn-eyebrow !text-[#5c6b63]">Book</p>
            <h2
              id="reindeer-book-heading"
              className="mt-2.5 font-display text-[1.75rem] font-semibold tracking-tight text-[#121816] sm:text-[2.1rem]"
            >
              Choose Your Reindeer Experience
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#5a675f]">
              Availability and checkout are provided by Santa Claus Reindeer via Bókun.
            </p>
          </div>

          <div className="rn-reindeer-widget mt-10 border border-black/[0.06] bg-[#fbfbfa] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
            <BokunProductList />
          </div>
        </div>
      </section>

      {/* Atmosphere */}
      <section className="rn-section bg-[#f7f6f3]" aria-label="Winter photography">
        <div className="rn-container">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {GALLERY.map((img) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-[var(--rn-radius-sm)] border border-black/[0.05]"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="aspect-[4/5] w-full object-cover sm:aspect-[3/4]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[11px] tracking-wide text-[#8a948e]">
            Temporary atmosphere photography — reindeer-specific images to follow.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default ReindeerRides

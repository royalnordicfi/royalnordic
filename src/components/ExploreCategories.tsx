import { Link } from 'react-router-dom'

const SECONDARY = [
  {
    title: 'Day adventures',
    text: 'Ice fishing, Korouoma Canyon, Ranua Wildlife Park.',
    to: '/daytime-experiences',
    image: '/korouoma1.jpg',
  },
  {
    title: 'Private & custom',
    text: 'Tailored itineraries for couples and private groups.',
    to: '/customized-tour',
    image: '/nortti5.jpg',
  },
  {
    title: 'Transfers',
    text: 'Private transport across Lapland, Rovaniemi–Levi.',
    to: '/transportation',
    image: '/transportation1.jpg',
  },
]

const ExploreCategories = () => {
  return (
    <section id="experiences" className="relative bg-[#050a08] pb-16 sm:pb-20 lg:pb-24" aria-label="Explore experiences">
      <div className="rn-container relative z-10 -mt-14 sm:-mt-20 lg:-mt-28">
        <p className="rn-eyebrow rn-reveal mb-3 text-white/85 sm:mb-4">Explore experiences</p>

        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <Link
            to="/northern-lights-tours"
            className="group rn-reveal rn-explore-tile rn-explore-tile--lead relative min-h-[240px] overflow-hidden rounded-rn-lg border border-white/[0.08] shadow-rn sm:min-h-[300px] lg:col-span-7 lg:min-h-[420px]"
          >
            <img
              src="/lights3.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/nortti1.jpg'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aurora-soft">
                Flagship
              </p>
              <h3 className="mt-1.5 font-display text-2xl font-semibold text-white sm:text-[2rem]">
                Northern Lights
              </h3>
              <p className="mt-1.5 max-w-sm text-[13.5px] leading-snug text-white/75 sm:text-sm">
                Guaranteed aurora hunts and family evenings from Rovaniemi.
              </p>
            </div>
          </Link>

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-5 lg:h-full lg:grid-cols-1 lg:grid-rows-3 lg:gap-4">
            {SECONDARY.map((cat) => (
              <Link
                key={cat.to}
                to={cat.to}
                className="group rn-reveal rn-explore-tile relative min-h-[128px] overflow-hidden rounded-rn border border-white/[0.08] shadow-rn-soft sm:min-h-[150px] lg:min-h-0"
              >
                <img
                  src={cat.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/nortti1.jpg'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/38 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  <h3 className="font-display text-base font-semibold text-white sm:text-[1.05rem]">
                    {cat.title}
                  </h3>
                  <p className="mt-0.5 max-w-xs text-[12.5px] leading-snug text-white/70 sm:text-[13px]">
                    {cat.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ExploreCategories

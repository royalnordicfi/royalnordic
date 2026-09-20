import { Link } from 'react-router-dom'

const SECONDARY = [
  {
    title: 'Day adventures',
    to: '/daytime-experiences',
    image: '/korouoma1.jpg',
    hint: 'Canyons, wildlife, and Arctic days',
  },
  {
    title: 'Private & custom',
    to: '/customized-tour',
    image: '/nortti5.jpg',
    hint: 'Tailored for your dates and group',
  },
  {
    title: 'Transfers',
    to: '/transportation',
    image: '/transportation1.jpg',
    hint: 'Private rides across Lapland',
  },
]

const ExploreCategories = () => {
  return (
    <section
      id="experiences"
      className="relative bg-[#050a08] pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14"
      aria-label="Explore experiences"
    >
      <div className="rn-container relative z-10">
        <div className="rn-reveal mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <div>
            <p className="rn-eyebrow">Experiences</p>
            <h2 className="rn-h2-tight mt-2 text-white">Explore Lapland with us</h2>
          </div>
          <Link
            to="/northern-lights-tours"
            className="text-sm font-semibold text-aurora-soft transition hover:text-white"
          >
            Northern Lights tours →
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <Link
            to="/northern-lights-tours"
            className="group rn-reveal rn-explore-tile rn-explore-tile--lead relative min-h-[220px] overflow-hidden rounded-rn-lg border border-white/[0.07] sm:min-h-[300px] lg:col-span-7 lg:min-h-[460px]"
          >
            <img
              src="/lights3.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/nortti1.jpg'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aurora-soft">
                Flagship
              </p>
              <h3 className="mt-1.5 font-display text-2xl font-semibold text-white sm:text-[2.1rem]">
                Northern Lights
              </h3>
              <p className="mt-1.5 max-w-sm text-[13.5px] leading-snug text-white/72 sm:text-sm">
                Guaranteed aurora hunts and family evenings from Rovaniemi.
              </p>
            </div>
          </Link>

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-5 lg:h-full lg:grid-cols-1 lg:grid-rows-3 lg:gap-4">
            {SECONDARY.map((cat) => (
              <Link
                key={cat.to}
                to={cat.to}
                className="group rn-reveal rn-explore-tile relative min-h-[118px] overflow-hidden rounded-rn border border-white/[0.07] sm:min-h-[150px] lg:min-h-0"
              >
                <img
                  src={cat.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/nortti1.jpg'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  <h3 className="font-display text-[1.08rem] font-semibold text-white sm:text-lg">
                    {cat.title}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-white/60">{cat.hint}</p>
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

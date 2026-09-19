import { Link } from 'react-router-dom'

const CATEGORIES = [
  {
    title: 'Northern Lights',
    text: 'Guaranteed aurora hunts and family evenings from Rovaniemi.',
    to: '/northern-lights-tours',
    image: '/lights3.jpg',
  },
  {
    title: 'Day adventures',
    text: 'Ice fishing, Korouoma Canyon, Ranua Wildlife Park, and more.',
    to: '/daytime-experiences',
    image: '/korouoma1.jpg',
  },
  {
    title: 'Private & custom',
    text: 'Tailored itineraries for couples, families, and private groups.',
    to: '/customized-tour',
    image: '/nortti5.jpg',
  },
  {
    title: 'Transfers',
    text: 'Private transportation across Lapland, including Rovaniemi–Levi.',
    to: '/transportation',
    image: '/transportation1.jpg',
  },
]

const ExploreCategories = () => {
  return (
    <section id="experiences" className="relative bg-[#050a08] py-14 sm:py-20 lg:py-24">
      <div className="rn-container">
        <div className="rn-panel rn-reveal relative overflow-hidden rounded-rn-lg px-5 py-7 shadow-rn sm:px-8 sm:py-9 lg:px-10 lg:py-11">
          <div className="max-w-xl">
            <p className="rn-eyebrow">Explore</p>
            <h2 className="rn-h2-tight rn-ink mt-2">
              Choose how you experience Lapland
            </h2>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.to}
                to={cat.to}
                className="group rn-reveal rn-category-tile relative min-h-[128px] overflow-hidden rounded-rn border border-black/[0.06] shadow-rn-soft transition-shadow duration-300 hover:shadow-rn sm:min-h-[150px]"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/38 to-black/5 transition-opacity duration-300 group-hover:from-black/95" />
                <div className="absolute inset-x-0 bottom-0 translate-y-0 p-3.5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 sm:p-4">
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

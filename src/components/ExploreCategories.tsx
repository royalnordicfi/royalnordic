import { Link } from 'react-router-dom'

const CATEGORIES = [
  {
    title: 'Northern Lights',
    text: 'Guaranteed aurora hunts and family evenings from Rovaniemi.',
    to: '/northern-lights-tours',
    image: '/nortti1.jpg',
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
    <section id="experiences" className="rn-section bg-surface">
      <div className="rn-container">
        <div className="max-w-2xl">
          <p className="rn-eyebrow">Explore Royal Nordic</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            Choose how you want to experience Lapland
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:gap-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="group relative min-h-[220px] overflow-hidden rounded-rn border border-white/10 sm:min-h-[260px]"
            >
              <img
                src={cat.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/nortti1.jpg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className="font-display text-2xl font-semibold text-white">{cat.title}</h3>
                <p className="mt-1.5 max-w-sm text-sm text-white/75">{cat.text}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-aurora-soft">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExploreCategories

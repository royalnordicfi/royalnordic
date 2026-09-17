import { Link } from 'react-router-dom'

const CATEGORIES = [
  {
    title: 'Northern Lights',
    text: 'Guaranteed aurora hunts and family-friendly evenings from Rovaniemi.',
    to: '/northern-lights-tours',
    image: '/nortti5.jpg',
  },
  {
    title: 'Day adventures',
    text: 'Ice fishing, Korouoma Canyon, Ranua Wildlife Park, and more.',
    to: '/daytime-experiences',
    image: '/icefishing3.jpg',
  },
  {
    title: 'Private & custom',
    text: 'Tailored itineraries for couples, families, and private groups.',
    to: '/customized-tour',
    image: '/slideshow1.jpg',
  },
  {
    title: 'Transfers',
    text: 'Private transportation across Lapland, including Rovaniemi–Levi.',
    to: '/transportation',
    image: '/transportation3.jpg',
  },
]

const ExploreCategories = () => {
  return (
    <section id="experiences" className="rn-section-frost">
      <div className="rn-container">
        <div className="max-w-2xl">
          <p className="rn-eyebrow !text-aurora-deep">Explore Royal Nordic</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Choose how you want to experience Lapland
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              to={cat.to}
              className="group relative isolate min-h-[18rem] overflow-hidden rounded-rn-lg"
            >
              <img
                src={cat.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/45 to-midnight/10" />
              <div className="relative flex h-full flex-col justify-end p-5 text-snow">
                <h3 className="font-display text-2xl font-semibold">{cat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-snow/75">{cat.text}</p>
                <span className="mt-4 text-sm font-semibold text-aurora-soft">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExploreCategories

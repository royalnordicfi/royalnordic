import { Link } from 'react-router-dom'

const GUIDES = [
  {
    to: '/blog/best-time-northern-lights-lapland-2025',
    title: 'Best time for Northern Lights in Lapland',
    excerpt: 'Seasons, weather, and practical timing tips from Rovaniemi.',
    image: '/nortti3.jpg',
  },
  {
    to: '/blog/what-to-wear-lapland-winter-clothing-guide',
    title: 'What to wear in Lapland winter',
    excerpt: 'Layers, boots, and how to stay warm on outdoor tours.',
    image: '/nortti5.jpg',
  },
  {
    to: '/blog/northern-lights-photography-tips-beginners',
    title: 'Northern Lights photography tips',
    excerpt: 'Simple aurora photography advice for first-time visitors.',
    image: '/lights7.jpg',
  },
]

const GuidesTeaser = () => {
  return (
    <section className="rn-section-frost">
      <div className="rn-container">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="rn-eyebrow !text-aurora-deep">Guides</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Plan with local context
            </h2>
          </div>
          <Link to="/blog" className="text-sm font-semibold text-aurora-deep hover:underline">
            All guides →
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {GUIDES.map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className="group overflow-hidden rounded-rn-lg bg-white shadow-rn-soft ring-1 ring-black/5"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={g.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-ink group-hover:text-aurora-deep">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">{g.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GuidesTeaser

import { Link } from 'react-router-dom'

const GUIDES = [
  {
    to: '/blog/best-time-northern-lights-lapland-2025',
    title: 'Best time for Northern Lights in Lapland',
    text: 'Seasons, weather, and practical timing tips from Rovaniemi.',
    image: '/nortti1.jpg',
  },
  {
    to: '/blog/what-to-wear-lapland-winter-clothing-guide',
    title: 'What to wear in Lapland winter',
    text: 'Layers, boots, and how to stay warm on outdoor tours.',
    image: '/nortti5.jpg',
  },
  {
    to: '/blog/northern-lights-photography-tips-beginners',
    title: 'Northern Lights photography tips',
    text: 'Simple aurora photography advice for first-time visitors.',
    image: '/lights7.jpg',
  },
]

const GuidesTeaser = () => {
  return (
    <section className="rn-section-tight bg-midnight">
      <div className="rn-container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="rn-eyebrow">Guides</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white">Plan with local context</h2>
          </div>
          <Link to="/blog" className="hidden text-sm font-semibold text-aurora-soft hover:underline sm:inline">
            All guides →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {GUIDES.map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className="group rn-blog-card overflow-hidden rounded-rn border border-white/10 bg-surface"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={g.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/nortti1.jpg'
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-white">{g.title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{g.text}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/blog" className="mt-5 inline-block text-sm font-semibold text-aurora-soft sm:hidden">
          All guides →
        </Link>
      </div>
    </section>
  )
}

export default GuidesTeaser

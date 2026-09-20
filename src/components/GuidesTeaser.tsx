import { Link } from 'react-router-dom'

const GUIDES = [
  {
    to: '/blog/best-time-northern-lights-lapland-2025',
    title: 'Best time for Northern Lights in Lapland',
    text: 'Seasons, weather, and practical timing tips from Rovaniemi.',
    image: '/nortti11.jpg',
    offset: '',
  },
  {
    to: '/blog/what-to-wear-lapland-winter-clothing-guide',
    title: 'What to wear in Lapland winter',
    text: 'Layers, boots, and how to stay warm on outdoor tours.',
    image: '/snowshoe1.jpg',
    offset: 'lg:mt-9',
  },
  {
    to: '/blog/northern-lights-photography-tips-beginners',
    title: 'Northern Lights photography tips',
    text: 'Simple aurora photography advice for first-time visitors.',
    image: '/lights7.jpg',
    offset: 'lg:mt-3',
  },
]

const GuidesTeaser = () => {
  return (
    <section className="rn-section-tight relative bg-midnight pt-6 sm:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#050a08] to-transparent" aria-hidden />
      <div className="rn-container relative">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="rn-eyebrow">Travel guides</p>
            <h2 className="rn-h2-tight mt-2.5 text-white">Plan with local context</h2>
          </div>
          <Link
            to="/blog"
            className="hidden text-sm font-semibold text-aurora-soft transition hover:text-white sm:inline"
          >
            All guides →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3 lg:items-start lg:gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className={`group rn-blog-card overflow-hidden rounded-rn border border-white/[0.07] bg-surface transition duration-300 hover:border-white/[0.12] ${g.offset}`}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={g.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/nortti1.jpg'
                  }}
                />
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-display text-[1.1rem] font-semibold leading-snug text-white sm:text-lg">
                  {g.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-muted">{g.text}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/blog" className="mt-6 inline-block text-sm font-semibold text-aurora-soft sm:hidden">
          All guides →
        </Link>
      </div>
    </section>
  )
}

export default GuidesTeaser

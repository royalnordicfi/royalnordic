import { Link } from 'react-router-dom'
import { BLOG_CATALOG } from '../../data/blogCatalog'

const GUIDES = BLOG_CATALOG.slice(0, 3)

export default function HomeJournal() {
  return (
    <section className="rn-home-section rn-home-section--ivory" aria-labelledby="rn-home-journal-heading">
      <div className="rn-container">
        <header className="rn-home-section__head rn-reveal flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="rn-home-eyebrow">Travel journal</p>
            <h2 id="rn-home-journal-heading" className="rn-home-h2 mt-3">
              Guides from Rovaniemi
            </h2>
            <p className="rn-home-lede mt-3">
              Practical notes on seasons, packing and photography — written for visitors planning a
              Lapland trip.
            </p>
          </div>
          <Link to="/blog" className="rn-home-btn rn-home-btn--text shrink-0">
            All guides →
          </Link>
        </header>

        <ul className="rn-home-journal rn-stagger mt-10 sm:mt-12">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link to={`/blog/${guide.slug}`} className="rn-home-journal-card rn-reveal group">
                <div className="rn-home-journal-card__media">
                  <img
                    src={guide.image}
                    alt={guide.imageAlt}
                    className="rn-home-journal-card__img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="rn-home-journal-card__body">
                  <span className="rn-home-journal-card__tag">{guide.category}</span>
                  <h3 className="rn-home-journal-card__title">{guide.title}</h3>
                  <p className="rn-home-journal-card__excerpt">{guide.excerpt}</p>
                  <p className="rn-home-journal-card__meta">{guide.readTime} read</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

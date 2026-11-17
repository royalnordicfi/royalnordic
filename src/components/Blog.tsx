import { Link } from 'react-router-dom'
import Footer from './Footer'
import { BLOG_CATALOG } from '../data/blogCatalog'

/**
 * Editorial journal index — all posts visible (no ghost reveal voids).
 * 12 posts fill 4×3 desktop / 6×2 tablet / 12×1 mobile without pagination.
 */
const Blog = () => {
  return (
    <div className="rn-page">
      <header className="rn-blog-index-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-90" aria-hidden />
        <div className="rn-container rn-shell-pad relative pb-8 sm:pb-10">
          <p className="rn-eyebrow">Travel journal</p>
          <h1 className="rn-blog-index-hero__title mt-2.5 font-display font-semibold text-white">
            Lapland travel guides
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-text-muted">
            Practical notes on Northern Lights, packing, wildlife, and winter activities — for visitors
            planning from Rovaniemi.
          </p>
        </div>
      </header>

      <section className="relative border-t border-white/[0.05] pb-14 sm:pb-16 lg:pb-20">
        <div className="rn-container">
          <ul className="rn-blog-grid">
            {BLOG_CATALOG.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="group rn-blog-card">
                  <div className="rn-blog-card__media">
                    <img
                      src={post.image}
                      alt={post.imageAlt}
                      className="rn-blog-card__img"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = '/lights5.jpg'
                      }}
                    />
                    <div className="rn-blog-card__shade" aria-hidden />
                  </div>
                  <div className="rn-blog-card__body">
                    <span className="rn-blog-card__tag">{post.category}</span>
                    <h2 className="rn-blog-card__title">{post.title}</h2>
                    <p className="rn-blog-card__excerpt">{post.excerpt}</p>
                    <p className="rn-blog-card__meta">{post.readTime} read</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="rn-page-end mt-12 border-t border-white/[0.07] pt-8 sm:mt-14 sm:pt-10">
            <p className="text-sm text-text-muted">Ready to experience Lapland in person?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/northern-lights-tour" className="rn-btn-primary">
                Small Group Northern Lights
              </Link>
              <Link to="/daytime-experiences" className="rn-btn-secondary">
                Day tours
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Blog

import { Link } from 'react-router-dom'

const GUIDES = [
  {
    to: '/blog/best-time-northern-lights-lapland-2025',
    title: 'Best time for Northern Lights in Lapland',
    text: 'Seasons, weather, and practical timing tips from Rovaniemi.',
    image: '/nortti11.jpg',
    tag: 'Northern Lights',
  },
  {
    to: '/blog/what-to-wear-lapland-winter-clothing-guide',
    title: 'What to wear in Lapland winter',
    text: 'Layers, boots, and how to stay warm on outdoor tours.',
    image: '/snowshoe1.jpg',
    tag: 'Travel Tips',
  },
  {
    to: '/blog/northern-lights-photography-tips-beginners',
    title: 'Northern Lights photography tips',
    text: 'Simple aurora photography advice for first-time visitors.',
    image: '/lights7.jpg',
    tag: 'Photography',
  },
]

export default function HomeGuides() {
  return (
    <section className="rn-ql-section" aria-labelledby="rn-ql-guides-heading">
      <div className="rn-container">
        <header className="rn-ql-section__head rn-reveal">
          <div>
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Travel journal
            </p>
            <h2 id="rn-ql-guides-heading" className="rn-ql-h2 mt-3">
              Guides from Rovaniemi
            </h2>
          </div>
          <Link to="/blog" className="rn-ql-text-link">
            All guides
            <span aria-hidden> →</span>
          </Link>
        </header>

        <ul className="rn-ql-guides mt-10 sm:mt-12">
          {GUIDES.map((post) => (
            <li key={post.to}>
              <Link to={post.to} className="rn-ql-guide rn-reveal group">
                <div className="rn-ql-guide__media">
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = '/nortti1.jpg'
                    }}
                  />
                </div>
                <div className="rn-ql-guide__body">
                  <p className="rn-ql-guide__tag">{post.tag}</p>
                  <h3 className="rn-ql-guide__title">{post.title}</h3>
                  <p className="rn-ql-guide__excerpt">{post.text}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

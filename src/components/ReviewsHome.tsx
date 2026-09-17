import { Link } from 'react-router-dom'

/** Curated real guest quotes already used on the site — no invented ratings. */
const CURATED = [
  {
    name: 'Naif',
    text: 'We had a wonderful time with Walter, he was doing a lot of effort to visit many spots for helping us to see aurora. Also he provided us so much information about the most popular activities in Rovaniemi.',
  },
  {
    name: 'Guest review',
    text: 'Miro is a wonderful guy and a great guide, he showed us the Northern Lights after a bit of driving, wonderful experience! Recommended.',
  },
  {
    name: 'Verified guest',
    text: 'So glad we booked this experience! Miro went above and beyond to make sure we got to witness the northern lights… Five stars all round.',
  },
]

const ReviewsHome = () => {
  return (
    <section className="rn-section-snow" aria-labelledby="reviews-heading">
      <div className="rn-container">
        <div className="max-w-2xl">
          <p className="rn-eyebrow !text-aurora-deep">Guest stories</p>
          <h2 id="reviews-heading" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            What travellers remember
          </h2>
          <p className="mt-3 text-ink-muted">
            Real guest feedback from Northern Lights and Lapland experiences with our team.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CURATED.map((r) => (
            <blockquote
              key={r.text.slice(0, 24)}
              className="flex h-full flex-col rounded-rn-lg bg-white p-6 shadow-rn-soft ring-1 ring-black/5"
            >
              <p className="flex-1 text-base leading-relaxed text-ink">“{r.text}”</p>
              <footer className="mt-5 text-sm font-semibold text-ink-muted">{r.name}</footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/northern-lights-tour" className="rn-btn-on-snow">
            Book the Guaranteed Northern Lights Tour
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ReviewsHome

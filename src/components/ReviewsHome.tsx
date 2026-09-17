const REVIEWS = [
  {
    quote:
      'We had a wonderful time with Walter, he was doing a lot of effort to visit many spots for helping us to see aurora. Also he provided us so much information about the most popular activities in Rovaniemi.',
    name: 'Guest',
  },
  {
    quote:
      'Miro is a wonderful guy and a great guide, he showed us the Northern Lights after a bit of driving, wonderful experience! Recommended.',
    name: 'Guest',
  },
  {
    quote:
      'So glad we booked this experience! Miro went above and beyond to make sure we got to witness the northern lights… Five stars all round.',
    name: 'Guest',
  },
]

const ReviewsHome = () => {
  return (
    <section className="rn-section bg-midnight" aria-label="What travellers remember">
      <div className="rn-container">
        <div className="max-w-2xl">
          <p className="rn-eyebrow">Guest stories</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            What travellers remember
          </h2>
          <p className="mt-3 text-text-muted">
            Real guest feedback from Northern Lights and Lapland experiences with our team.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <blockquote
              key={r.quote.slice(0, 40)}
              className="rounded-rn border border-white/10 bg-surface p-5"
            >
              <p className="text-sm leading-relaxed text-text-muted">“{r.quote}”</p>
              <footer className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-dim">
                {r.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ReviewsHome

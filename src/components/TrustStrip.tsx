const items = [
  {
    title: 'Local expertise',
    text: 'Rovaniemi-based team planning around real Lapland conditions.',
  },
  {
    title: 'Small groups',
    text: 'Intimate groups on our guided experiences — not bus tours.',
  },
  {
    title: 'Professional photography',
    text: 'On our Guaranteed aurora hunt, your guide photographs you with the lights.',
  },
  {
    title: 'Flexible private travel',
    text: 'Custom itineraries and private transfers across Finnish Lapland.',
  },
]

const TrustStrip = () => {
  return (
    <div
      className="relative z-10 -mt-6 px-[var(--rn-gutter)] sm:-mt-10 sm:px-[var(--rn-gutter-sm)] lg:-mt-12 lg:px-[var(--rn-gutter-lg)]"
      aria-label="Why travellers book Royal Nordic"
    >
      <div className="rn-container !px-0">
        <div className="rn-trust-float rn-reveal overflow-hidden rounded-rn border border-white/[0.07] backdrop-blur-md">
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <li
                key={item.title}
                className={`px-3.5 py-3.5 sm:px-5 sm:py-4.5 ${
                  i % 2 === 1 ? 'border-l border-white/[0.06]' : ''
                } ${i > 1 ? 'border-t border-white/[0.06] lg:border-t-0' : ''} ${
                  i > 0 ? 'lg:border-l lg:border-white/[0.06]' : ''
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TrustStrip

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
      className="relative z-10 -mt-10 px-[var(--rn-gutter)] sm:-mt-16 sm:px-[var(--rn-gutter-sm)] lg:-mt-20 lg:px-[var(--rn-gutter-lg)]"
      aria-label="Why travellers book Royal Nordic"
    >
      <div className="rn-container !px-0">
        <div className="rn-trust-float rn-reveal overflow-hidden rounded-rn border border-white/[0.07] backdrop-blur-md">
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <li
                key={item.title}
                className={`px-3.5 py-4 sm:px-6 sm:py-5 ${
                  i % 2 === 1 ? 'border-l border-white/[0.06]' : ''
                } ${i > 1 ? 'border-t border-white/[0.06] lg:border-t-0' : ''} ${
                  i > 0 ? 'lg:border-l lg:border-white/[0.06]' : ''
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-[11.5px]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-text-muted sm:text-[12.5px]">
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

const TrustStrip = () => {
  const items = [
    {
      title: 'Northern Lights guarantee',
      text: 'Free return trip if no lights appear — see Terms.',
    },
    {
      title: 'Small groups',
      text: 'Max 8 guests per vehicle on our Guaranteed tour.',
    },
    {
      title: 'Hotel pickup',
      text: 'Pickup in the Rovaniemi area — flexible aurora hunting.',
    },
    {
      title: 'Book direct',
      text: 'Secure Stripe checkout and WhatsApp support.',
    },
  ]

  return (
    <div
      className="relative z-10 -mt-10 px-3.5 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8"
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

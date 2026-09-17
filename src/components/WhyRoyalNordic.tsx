const WhyRoyalNordic = () => {
  const points = [
    {
      title: 'We hunt, we don’t hope',
      text: 'Live forecasts and flexible driving — farther when clearer skies call for it.',
    },
    {
      title: 'Small groups by design',
      text: 'Our Guaranteed Northern Lights Tour caps at eight guests per vehicle.',
    },
    {
      title: 'Book direct with real support',
      text: 'Secure online checkout, hotel pickup coordination, and WhatsApp help.',
    },
  ]

  return (
    <section id="about" className="rn-section bg-surface">
      <div className="rn-container">
        <div className="max-w-2xl">
          <p className="rn-eyebrow">Why Royal Nordic</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            A local Lapland operator built for travellers who want the real night
          </h2>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="rounded-rn border border-white/10 bg-midnight/60 p-5">
              <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyRoyalNordic

const POINTS = [
  {
    title: 'We hunt, we don’t hope',
    text: 'Live forecasts and flexible driving — including farther when clearer skies call for it.',
  },
  {
    title: 'Small groups by design',
    text: 'Our Guaranteed Northern Lights Tour caps at eight guests per vehicle for a calmer night.',
  },
  {
    title: 'Book direct with real support',
    text: 'Secure online checkout, hotel pickup coordination, and WhatsApp help from our team.',
  },
]

const WhyRoyalNordic = () => {
  return (
    <section className="rn-section-dark" id="about">
      <div className="rn-container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="rn-eyebrow">Why Royal Nordic</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-snow sm:text-4xl">
              A local Lapland operator built for travellers who want the real night — not a rushed stop.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-rn-lg border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-display text-xl text-snow">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-snow/65">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyRoyalNordic

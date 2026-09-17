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
      title: 'Local from Rovaniemi',
      text: 'Hotel pickup and flexible aurora hunting.',
    },
    {
      title: 'Book direct',
      text: 'Secure Stripe checkout and WhatsApp support.',
    },
  ]

  return (
    <section
      className="relative border-y border-white/[0.07] bg-[#070e0c]"
      aria-label="Why travellers book Royal Nordic"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(18,185,129,0.08),transparent_55%)]" aria-hidden />
      <div className="rn-container relative grid gap-5 py-6 sm:grid-cols-2 sm:gap-6 sm:py-7 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rn-reveal">
            <p className="text-[13px] font-semibold text-white/95">{item.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TrustStrip

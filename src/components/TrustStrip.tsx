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
    <section className="border-y border-white/10 bg-surface" aria-label="Why travellers book Royal Nordic">
      <div className="rn-container grid gap-5 py-6 sm:grid-cols-2 sm:gap-6 sm:py-7 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title}>
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TrustStrip

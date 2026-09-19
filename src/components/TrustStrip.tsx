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
    <div className="relative z-10 -mt-7 px-4 sm:-mt-9 sm:px-6 lg:-mt-11 lg:px-8" aria-label="Why travellers book Royal Nordic">
      <div className="rn-container !px-0">
        <div className="rn-trust-float rn-reveal grid gap-4 gap-y-5 rounded-rn-lg border border-white/[0.08] bg-elevated/95 px-5 py-5 shadow-rn backdrop-blur sm:grid-cols-2 sm:gap-6 sm:px-7 sm:py-6 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.title}>
              <p className="text-[12.5px] font-semibold text-white/95">{item.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrustStrip

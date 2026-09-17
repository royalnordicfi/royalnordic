import { Camera, MapPin, ShieldCheck, Users } from 'lucide-react'

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Northern Lights guarantee',
    text: 'Free return trip if no lights appear — see Terms for the exact promise.',
  },
  {
    icon: Users,
    title: 'Small groups',
    text: 'Max 8 guests per vehicle on our Guaranteed Northern Lights Tour.',
  },
  {
    icon: MapPin,
    title: 'Local from Rovaniemi',
    text: 'Hotel pickup in the Rovaniemi area and flexible aurora hunting.',
  },
  {
    icon: Camera,
    title: 'Photography guidance',
    text: 'Guides help you capture the night — not a rushed lookout stop.',
  },
]

const TrustStrip = () => {
  return (
    <section className="rn-section-snow !py-10 sm:!py-12" aria-label="Why travellers book Royal Nordic">
      <div className="rn-container">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora/10 text-aurora-deep">
                <Icon size={18} strokeWidth={2} aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustStrip

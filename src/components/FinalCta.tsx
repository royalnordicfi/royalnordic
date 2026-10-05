import { Link } from 'react-router-dom'

const FinalCta = () => {
  return (
    <section className="border-t border-white/[0.07] bg-surface py-14 sm:py-16 lg:py-20">
      <div className="rn-container flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-rn-measure">
          <p className="rn-eyebrow">Book direct</p>
          <h2 className="rn-h2-tight mt-2.5 text-white">
            Ready when you are
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
            Check availability for our Guaranteed Northern Lights tour, or tell us what kind of
            Lapland trip you need — we reply personally.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/northern-lights-tour" className="rn-btn-primary min-h-[48px] justify-center px-7">
            Check availability
          </Link>
          <Link to="/contact" className="rn-btn-secondary min-h-[48px] justify-center px-7">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FinalCta

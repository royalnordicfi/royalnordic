import { Link } from 'react-router-dom'

const FinalCta = () => {
  return (
    <section className="border-t border-white/[0.06] bg-surface py-11 sm:py-12 lg:py-14">
      <div className="rn-container flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="max-w-rn-measure">
          <p className="rn-eyebrow">Book direct</p>
          <h2 className="rn-h2-tight mt-2 text-white">Ready when you are</h2>
          <p className="rn-section-lede">
            Check availability for our Small Group Northern Lights tour, or tell us what kind of Lapland trip you
            need — we reply personally.
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

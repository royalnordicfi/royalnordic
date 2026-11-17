import ExperienceBreadcrumb, { type BreadcrumbItem } from './ExperienceBreadcrumb'
import ExperienceGallery, { type GalleryImage } from '../ExperienceGallery'
import ExperienceFacts, { type FactItem } from './ExperienceFacts'

export type CinematicHeroConfig = {
  image: string
  imageAlt: string
  /** Optional second image for subtle crossfade on desktop */
  imageSecondary?: string
}

type Props = {
  breadcrumbs: BreadcrumbItem[]
  eyebrow: string
  title: string
  lede: string
  images: GalleryImage[]
  facts: FactItem[]
  /** Sticky booking / quote card. Omit for full-width content (e.g. in-page request forms). */
  booking?: React.ReactNode
  /** Optional note/link under the sticky booking card (outside the sticky box) */
  bookingBelow?: React.ReactNode
  /** Placed directly under the gallery (before facts / editorial) */
  afterGallery?: React.ReactNode
  children: React.ReactNode
  afterContent?: React.ReactNode
  proof?: React.ReactNode
  benefits?: readonly string[]
  heroAction?: React.ReactNode
  /**
   * Full-bleed cinematic product hero.
   * When set with booking, copy sits left and the real booking panel sits right.
   */
  cinematic?: CinematicHeroConfig
}

/**
 * Shared two-column tour / experience / transfer product shell (Royal Nordic 2.0).
 * Desktop (lg+): cinematic copy left, live booking card sticky on the right.
 * Mobile/tablet: intro → booking → gallery/editorial; MobileBookingBar for sticky CTA.
 */
export default function ExperienceProductLayout({
  breadcrumbs,
  eyebrow,
  title,
  lede,
  images,
  facts,
  booking,
  bookingBelow,
  afterGallery,
  children,
  afterContent,
  proof,
  benefits,
  heroAction,
  cinematic,
}: Props) {
  const cinema = Boolean(cinematic)
  const hasBook = Boolean(booking)

  const benefitList =
    benefits && benefits.length > 0 ? (
      <ul
        className={`rn-benefit-rail ${cinema ? 'rn-benefit-rail--on-media' : ''}`}
        aria-label="Key benefits"
      >
        {benefits.slice(0, 4).map((item) => (
          <li key={item}>
            <span className="rn-benefit-rail__icon" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : null

  const editorial = (
    <>
      {images.length > 0 ? (
        <div className="rn-product__gallery">
          <ExperienceGallery images={images} />
        </div>
      ) : null}
      {afterGallery ? <div className="mt-4 sm:mt-6">{afterGallery}</div> : null}
      {facts.length > 0 ? (
        <div className="mt-5 sm:mt-7">
          <ExperienceFacts items={facts} />
        </div>
      ) : null}
      <div className="rn-product__editorial mt-2">{children}</div>
    </>
  )

  if (cinema && cinematic) {
    return (
      <div className="rn-product rn-product--v2 rn-product--cinema">
        <div className="rn-exp-stage">
          <div className="rn-exp-stage__media" aria-hidden>
            <img
              src={cinematic.image}
              alt=""
              className="rn-exp-stage__img"
              fetchPriority="high"
            />
            {cinematic.imageSecondary ? (
              <img
                src={cinematic.imageSecondary}
                alt=""
                className="rn-exp-stage__ghost"
              />
            ) : null}
            <div className="rn-exp-stage__veil" />
            <div className="rn-hero-chrome-veil rn-exp-stage__chrome" />
          </div>

          <div
            className={`rn-container-product rn-exp-stage__grid ${
              hasBook ? 'rn-exp-stage__grid--book' : ''
            }`}
          >
            <header className="rn-exp-stage__intro">
              <ExperienceBreadcrumb items={breadcrumbs} tone="onMedia" />
              <div className="rn-exp-stage__copy">
                <p className="rn-exp-stage__eyebrow">{eyebrow}</p>
                <h1 className="rn-exp-stage__title">{title}</h1>
                <p className="rn-exp-stage__lede">{lede}</p>
                {proof ? <div className="rn-product__proof rn-product__proof--on-media">{proof}</div> : null}
                {benefitList}
                {/* Redundant on desktop when the live booking panel is visible beside the copy */}
                {heroAction ? (
                  <div className={`rn-exp-stage__actions ${hasBook ? 'lg:hidden' : ''}`}>
                    {heroAction}
                  </div>
                ) : null}
              </div>
            </header>

            {hasBook ? (
              <aside id="book" className="rn-exp-stage__book">
                <div className="rn-sticky-book rn-product__book">{booking}</div>
                {bookingBelow ? <div className="mt-2.5">{bookingBelow}</div> : null}
              </aside>
            ) : null}

            <div className="rn-exp-body">{editorial}</div>
          </div>
        </div>
        {afterContent}
      </div>
    )
  }

  return (
    <div className="rn-product rn-product--v2">
      <div className="rn-product__glow" aria-hidden />
      <div className="rn-container-product rn-shell-pad rn-shell-pad--product pb-16 sm:pb-24">
        <ExperienceBreadcrumb items={breadcrumbs} />

        <div
          className={
            hasBook
              ? 'mt-4 grid gap-7 sm:gap-8 lg:mt-8 lg:grid-cols-12 lg:items-start lg:gap-x-10 xl:gap-x-14'
              : 'mt-4 lg:mt-8'
          }
        >
          <div className={hasBook ? 'min-w-0 lg:col-span-7' : 'min-w-0'}>
            <header className="rn-product__intro rn-reveal max-w-rn-narrow">
              <p className="rn-eyebrow">{eyebrow}</p>
              <h1 className="rn-product__title mt-2.5 font-display font-semibold text-white sm:mt-3">
                {title}
              </h1>
              <p className="rn-product__lede mt-3.5 text-[15px] leading-relaxed text-text-muted sm:mt-4 sm:text-[16.5px] sm:leading-[1.65]">
                {lede}
              </p>
              {proof ? <div className="rn-product__proof mt-4">{proof}</div> : null}
              {benefitList ? <div className="mt-6 sm:mt-7">{benefitList}</div> : null}
              {heroAction ? (
                <div className={`mt-7 flex flex-wrap items-center gap-3 ${hasBook ? 'lg:hidden' : ''}`}>
                  {heroAction}
                </div>
              ) : null}
            </header>

            <div className="rn-exp-body rn-exp-body--inset mt-8 sm:mt-10">{editorial}</div>
          </div>

          {hasBook ? (
            <aside id="book" className="lg:col-span-5 lg:self-start">
              <div className="rn-sticky-book rn-product__book">{booking}</div>
              {bookingBelow ? <div className="mt-2.5">{bookingBelow}</div> : null}
            </aside>
          ) : null}
        </div>
      </div>
      {afterContent}
    </div>
  )
}

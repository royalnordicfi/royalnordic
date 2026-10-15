import ExperienceBreadcrumb, { type BreadcrumbItem } from './ExperienceBreadcrumb'
import ExperienceGallery, { type GalleryImage } from '../ExperienceGallery'
import ExperienceFacts, { type FactItem } from './ExperienceFacts'

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
}

/**
 * Shared two-column tour / experience / transfer product shell.
 * Desktop (lg+): content left, booking card sticky + viewport-capped on the right.
 * Mobile/tablet: single column; sticky sidebar off — MobileBookingBar handles CTA.
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
}: Props) {
  return (
    <div className="rn-product">
      <div className="rn-product__glow" aria-hidden />
      <div className="rn-container-product rn-shell-pad rn-shell-pad--product pb-16 sm:pb-24">
        <ExperienceBreadcrumb items={breadcrumbs} />

        {/* items-stretch so the booking aside is as tall as content — required for sticky */}
        <div
          className={
            booking
              ? 'mt-5 grid gap-10 lg:mt-8 lg:grid-cols-12 lg:items-stretch lg:gap-x-14 xl:gap-x-16'
              : 'mt-5 lg:mt-8'
          }
        >
          <div className={booking ? 'min-w-0 lg:col-span-7' : 'min-w-0'}>
            <header className="rn-product__intro rn-reveal max-w-rn-narrow">
              <p className="rn-eyebrow">{eyebrow}</p>
              <h1 className="rn-product__title mt-2.5 font-display font-semibold text-white">
                {title}
              </h1>
              <p className="rn-product__lede mt-3.5 text-[15px] leading-relaxed text-text-muted sm:text-[16px]">
                {lede}
              </p>
              {proof ? <div className="rn-product__proof mt-3.5">{proof}</div> : null}
              {benefits && benefits.length > 0 ? (
                <ul className="rn-benefit-rail mt-6" aria-label="Key benefits">
                  {benefits.slice(0, 5).map((item) => (
                    <li key={item}>
                      <span className="rn-benefit-rail__mark" aria-hidden>
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {heroAction ? (
                <div className="mt-7 flex flex-wrap items-center gap-3 lg:hidden">{heroAction}</div>
              ) : null}
              {heroAction ? (
                <div className="mt-7 hidden lg:block">
                  <div className="flex flex-wrap items-center gap-3">{heroAction}</div>
                </div>
              ) : null}
            </header>

            {images.length > 0 ? (
              <div className="rn-product__gallery mt-8 sm:mt-9">
                <ExperienceGallery images={images} />
              </div>
            ) : null}

            {afterGallery ? <div className="mt-5 sm:mt-6">{afterGallery}</div> : null}

            {facts.length > 0 ? (
              <div className="mt-6 sm:mt-7">
                <ExperienceFacts items={facts} />
              </div>
            ) : null}

            <div className="rn-product__editorial mt-2">{children}</div>
          </div>

          {booking ? (
            <aside id="book" className="lg:col-span-5 lg:self-stretch">
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

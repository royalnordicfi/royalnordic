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
  booking: React.ReactNode
  children: React.ReactNode
  afterContent?: React.ReactNode
  proof?: React.ReactNode
  benefits?: readonly string[]
  heroAction?: React.ReactNode
}

/**
 * Shared two-column tour product shell.
 * Desktop: content left, sticky booking right.
 * Mobile: stacked content + booking; sticky bar handled by page.
 */
export default function ExperienceProductLayout({
  breadcrumbs,
  eyebrow,
  title,
  lede,
  images,
  facts,
  booking,
  children,
  afterContent,
  proof,
  benefits,
  heroAction,
}: Props) {
  return (
    <div className="rn-product">
      <div className="rn-product__glow" aria-hidden />
      <div className="rn-container rn-shell-pad rn-shell-pad--product pb-16 sm:pb-20">
        <ExperienceBreadcrumb items={breadcrumbs} />

        <div className="mt-5 grid items-start gap-10 lg:mt-7 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-14">
          <div className="min-w-0 lg:col-span-7">
            <header className="rn-product__intro rn-reveal max-w-2xl">
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

            {facts.length > 0 ? (
              <div className="mt-6 sm:mt-7">
                <ExperienceFacts items={facts} />
              </div>
            ) : null}

            <div className="rn-product__editorial mt-2">{children}</div>
          </div>

          <aside id="book" className="lg:col-span-5">
            <div className="rn-sticky-book rn-product__book">{booking}</div>
          </aside>
        </div>
      </div>
      {afterContent}
    </div>
  )
}

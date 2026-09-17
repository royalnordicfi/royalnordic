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
}

/**
 * Art-directed product composition:
 * title + gallery + facts + editorial column share one grid with sticky booking.
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
}: Props) {
  return (
    <div className="rn-product">
      <div className="rn-product__glow" aria-hidden />
      <div className="rn-container rn-shell-pad pb-16 pt-4 sm:pt-6">
        <ExperienceBreadcrumb items={breadcrumbs} />

        <div className="mt-4 grid items-start gap-7 lg:mt-5 lg:grid-cols-12 lg:gap-x-9 xl:gap-x-11">
          <div className="min-w-0 lg:col-span-7">
            <header className="rn-product__intro max-w-2xl">
              <p className="rn-eyebrow">{eyebrow}</p>
              <h1 className="rn-product__title mt-2 font-display font-semibold text-white">
                {title}
              </h1>
              <p className="rn-product__lede mt-2.5 text-[15px] leading-relaxed text-text-muted sm:text-[15.5px]">
                {lede}
              </p>
            </header>

            <div className="rn-product__gallery mt-5 sm:mt-6">
              <ExperienceGallery images={images} />
            </div>

            <div className="mt-5 sm:mt-6">
              <ExperienceFacts items={facts} />
            </div>

            <div className="rn-product__editorial mt-9 space-y-10 sm:mt-11 sm:space-y-11">
              {children}
            </div>
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

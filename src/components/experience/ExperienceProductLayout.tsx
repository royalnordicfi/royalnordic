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
}

/**
 * Art-directed product composition.
 * Shell clearance comes ONLY from .rn-shell-pad — never add Tailwind pt-*.
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
}: Props) {
  return (
    <div className="rn-product">
      <div className="rn-product__glow" aria-hidden />
      <div className="rn-container rn-shell-pad rn-shell-pad--product pb-16 sm:pb-20">
        <ExperienceBreadcrumb items={breadcrumbs} />

        <div className="mt-6 grid items-start gap-8 lg:mt-7 lg:grid-cols-12 lg:gap-x-10 xl:gap-x-12">
          <div className="min-w-0 lg:col-span-7">
            <header className="rn-product__intro rn-reveal max-w-2xl">
              <p className="rn-eyebrow">{eyebrow}</p>
              <h1 className="rn-product__title mt-2.5 font-display font-semibold text-white">
                {title}
              </h1>
              <p className="rn-product__lede mt-3 text-[15px] leading-relaxed text-text-muted sm:text-[15.5px]">
                {lede}
              </p>
              {proof ? <div className="rn-product__proof mt-3.5">{proof}</div> : null}
            </header>

            <div className="rn-product__gallery mt-6 sm:mt-7">
              <ExperienceGallery images={images} />
            </div>

            <div className="mt-5 sm:mt-6">
              <ExperienceFacts items={facts} />
            </div>

            <div className="rn-product__editorial mt-10 space-y-10 sm:mt-12 sm:space-y-12">
              {children}
            </div>
          </div>

          <aside id="book" className="lg:col-span-5 lg:pt-1">
            <div className="rn-sticky-book rn-product__book">{booking}</div>
          </aside>
        </div>
      </div>
      {afterContent}
    </div>
  )
}

import { useEffect, useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export type GalleryImage = {
  src: string
  alt: string
  position?: string
}

type ExperienceGalleryProps = {
  images: GalleryImage[]
}

const FALLBACK_IMAGE = '/nortti1.jpg'

const onGalleryImageError = (e: SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return
  e.currentTarget.src = FALLBACK_IMAGE
}

const ExperienceGallery = ({ images }: ExperienceGalleryProps) => {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const primary = images[0]
  const side = images.slice(1, 3)
  const count = images.length

  useEffect(() => {
    if (lightbox == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i == null ? 0 : (i + 1) % count))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i == null ? 0 : (i - 1 + count) % count))
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox, count])

  if (!primary) return null

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className="rn-gallery__tile relative w-[82%] shrink-0 snap-center overflow-hidden"
              onClick={() => setLightbox(i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="aspect-[16/9] max-h-[12rem] w-full object-cover sm:max-h-none"
                style={img.position ? { objectPosition: img.position } : undefined}
                loading={i === 0 ? 'eager' : 'lazy'}
                onError={onGalleryImageError}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-2.5 text-sm font-medium text-aurora-soft transition hover:text-white"
          onClick={() => setLightbox(0)}
        >
          View gallery · {count} photos
        </button>
      </div>

      {/* Desktop editorial — adapts to 1–3+ images without empty voids */}
      <div
        className={`rn-gallery hidden lg:grid ${
          side.length === 0
            ? 'rn-gallery--solo'
            : side.length === 1
              ? 'rn-gallery--duo'
              : 'rn-gallery--trio'
        }`}
      >
        <button
          type="button"
          className="rn-gallery__tile rn-gallery__main group relative overflow-hidden"
          onClick={() => setLightbox(0)}
        >
          <img
            src={primary.src}
            alt={primary.alt}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            style={primary.position ? { objectPosition: primary.position } : undefined}
            loading="eager"
            onError={onGalleryImageError}
          />
          <span className="rn-gallery__veil" aria-hidden />
        </button>
        {side.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className={`rn-gallery__tile rn-gallery__side group relative overflow-hidden rn-gallery__side--${i + 1}`}
            onClick={() => setLightbox(i + 1)}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
              style={img.position ? { objectPosition: img.position } : undefined}
              loading="lazy"
              onError={onGalleryImageError}
            />
            <span className="rn-gallery__veil" aria-hidden />
            {i === side.length - 1 && count > 3 && (
              <span className="absolute inset-0 flex items-center justify-center bg-[#030706]/55 text-sm font-medium text-white backdrop-blur-[1px]">
                +{count - 3} more
              </span>
            )}
          </button>
        ))}
      </div>

      {lightbox != null &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#030706]/94 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Photo gallery"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-zoom-out"
              aria-label="Close gallery"
              onClick={() => setLightbox(null)}
            />
            <button
              type="button"
              className="absolute right-4 top-4 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/15 bg-white/5 text-snow"
              aria-label="Close"
              onClick={() => setLightbox(null)}
            >
              <X size={20} />
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/15 bg-white/5 text-snow sm:left-6"
                  aria-label="Previous photo"
                  onClick={() => setLightbox((i) => (i == null ? 0 : (i - 1 + count) % count))}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="absolute right-3 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/15 bg-white/5 text-snow sm:right-6"
                  aria-label="Next photo"
                  onClick={() => setLightbox((i) => (i == null ? 0 : (i + 1) % count))}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <img
              src={images[lightbox].src}
              alt={images[lightbox].alt}
              className="relative z-[1] max-h-[85vh] max-w-[min(100%,56rem)] rounded object-contain"
              onError={onGalleryImageError}
            />
            <p className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-xs text-white/60">
              {lightbox + 1} / {count}
            </p>
          </div>,
          document.body
        )}
    </>
  )
}

export default ExperienceGallery

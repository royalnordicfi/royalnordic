import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export type GalleryImage = {
  src: string
  alt: string
}

type ExperienceGalleryProps = {
  images: GalleryImage[]
}

const ExperienceGallery = ({ images }: ExperienceGalleryProps) => {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const primary = images[0]
  const secondary = images.slice(1, 5)

  useEffect(() => {
    if (lightbox == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i == null ? 0 : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i == null ? 0 : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox, images.length])

  if (!primary) return null

  return (
    <>
      {/* Mobile swipe strip */}
      <div className="lg:hidden">
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className="relative w-[85%] shrink-0 snap-center overflow-hidden rounded-rn-lg"
              onClick={() => setLightbox(i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="aspect-[4/3] w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-aurora-soft"
          onClick={() => setLightbox(0)}
        >
          View all photos ({images.length})
        </button>
      </div>

      {/* Desktop editorial grid */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-4 lg:grid-rows-2 lg:h-[28rem]">
        <button
          type="button"
          className="relative col-span-2 row-span-2 overflow-hidden rounded-rn-lg"
          onClick={() => setLightbox(0)}
        >
          <img src={primary.src} alt={primary.alt} className="h-full w-full object-cover" loading="eager" />
        </button>
        {secondary.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className="relative overflow-hidden rounded-rn-lg"
            onClick={() => setLightbox(i + 1)}
          >
            <img src={img.src} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
            {i === secondary.length - 1 && images.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-midnight/55 text-sm font-semibold text-snow">
                View all photos
              </span>
            )}
          </button>
        ))}
      </div>

      {lightbox != null &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-midnight/92 p-4" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 cursor-zoom-out"
              aria-label="Close gallery"
              onClick={() => setLightbox(null)}
            />
            <button
              type="button"
              className="absolute right-4 top-4 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-snow"
              aria-label="Close"
              onClick={() => setLightbox(null)}
            >
              <X size={22} />
            </button>
            <img
              src={images[lightbox].src}
              alt={images[lightbox].alt}
              className="relative z-[1] max-h-[85vh] max-w-full rounded-rn object-contain"
            />
          </div>,
          document.body
        )}
    </>
  )
}

export default ExperienceGallery

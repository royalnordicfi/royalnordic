import { useEffect } from 'react'

export type PageMetaInput = {
  title: string
  description: string
  canonicalPath?: string
  ogImage?: string
  noIndex?: boolean
}

const SITE = 'https://royalnordic.fi'
const DEFAULT_OG = `${SITE}/nortti1.jpg`

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

/**
 * Per-route SEO for the Vite SPA. Call from page components.
 */
export function usePageMeta({
  title,
  description,
  canonicalPath = '/',
  ogImage = DEFAULT_OG,
  noIndex = false,
}: PageMetaInput) {
  useEffect(() => {
    const canonical = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${SITE}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`

    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'title', title)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Royal Nordic')
    setMeta('property', 'og:locale', 'en_FI')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:image:alt', title)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    setCanonical(canonical)
  }, [title, description, canonicalPath, ogImage, noIndex])
}

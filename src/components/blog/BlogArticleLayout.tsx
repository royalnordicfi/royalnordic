import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Clock, List } from 'lucide-react'
import Footer from '../Footer'
import {
  EXPERIENCE_CARD_IMAGES,
  relatedBlogEntries,
  type BlogCatalogEntry,
} from '../../data/blogCatalog'

export type RelatedExperience = {
  title: string
  href: string
  description?: string
  image?: string
  imageAlt?: string
  cta?: string
}

export type ArticleFigure = {
  src: string
  alt: string
  caption?: string
  /** Inject after the first h2 whose text includes this (case-insensitive). */
  afterHeading?: string
}

export type BlogArticleLayoutProps = {
  title: string
  excerpt: string
  category: string
  readTime: string
  slug: string
  author?: string
  date?: string
  heroImage?: string
  heroImageAlt?: string
  content: string
  relatedExperiences?: RelatedExperience[]
  figures?: ArticleFigure[]
}

type TocItem = { id: string; label: string }

const looksLikeHtml = (content: string): boolean =>
  /<\/?(?:p|div|h[1-6]|ul|ol|li|a|strong|aside)\b/i.test(content)

function slugifyHeading(text: string, used: Map<string, number>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section'
  const n = used.get(base) || 0
  used.set(base, n + 1)
  return n === 0 ? base : `${base}-${n + 1}`
}

function stripClasses(html: string): string {
  return html.replace(/\sclass=(["'])[\s\S]*?\1/gi, '')
}

function markdownToHtml(markdown: string): string {
  if (looksLikeHtml(markdown)) {
    return markdown.trim()
  }

  let md = markdown.trim()
  // Inline markdown pro tips → callout
  md = md.replace(
    /\*\*Pro Tip\*\*[:\s]*([^\n]+)/gi,
    (_m, tip: string) =>
      `\n\n<aside class="rn-article-callout"><p class="rn-article-callout__label">Tip</p><p>${tip.trim()}</p></aside>\n\n`,
  )

  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block.trim()}</ul>`)
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<(h[2-3]|ul|ol|div|aside)\b/i.test(trimmed)) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')
}

function transformHtmlProTips(html: string): string {
  return html.replace(
    /<div[^>]*>\s*<h3[^>]*>\s*Pro Tip\s*<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/gi,
    (_m, body: string) =>
      `<aside class="rn-article-callout"><p class="rn-article-callout__label">Tip</p><p>${body.trim()}</p></aside>`,
  )
}

function decorateHeadings(html: string): { html: string; toc: TocItem[] } {
  const used = new Map<string, number>()
  const toc: TocItem[] = []
  const next = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    const label = inner.replace(/<[^>]+>/g, '').trim()
    const id = slugifyHeading(label, used)
    toc.push({ id, label })
    const cleanedAttrs = String(attrs || '').replace(/\s*id=(["'])[\s\S]*?\1/i, '')
    return `<h2${cleanedAttrs} id="${id}">${inner}</h2>`
  })
  return { html: next, toc }
}

function injectFigures(html: string, figures: ArticleFigure[] = []): string {
  let out = html
  for (const fig of figures) {
    const figureHtml = `
<figure class="rn-article-figure">
  <img src="${fig.src}" alt="${fig.alt.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" />
  ${fig.caption ? `<figcaption>${fig.caption}</figcaption>` : ''}
</figure>`
    if (fig.afterHeading) {
      const needle = fig.afterHeading.toLowerCase()
      const re = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi
      let matched = false
      out = out.replace(re, (full, attrs: string, inner: string) => {
        if (matched) return full
        const label = inner.replace(/<[^>]+>/g, '').trim().toLowerCase()
        if (!label.includes(needle)) return full
        matched = true
        // Insert after the following block until next h2 — place right after this h2
        return `${full}${figureHtml}`
      })
      if (!matched) out += figureHtml
    } else {
      // After first paragraph
      const idx = out.search(/<\/p>/i)
      if (idx >= 0) {
        out = `${out.slice(0, idx + 4)}${figureHtml}${out.slice(idx + 4)}`
      } else {
        out = figureHtml + out
      }
    }
  }
  return out
}

function enhanceListGroups(html: string): string {
  // Mark short-item lists as chip grids when every li is under ~60 chars
  return html.replace(/<ul>([\s\S]*?)<\/ul>/gi, (full, inner: string) => {
    const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
    if (items.length < 3) return full
    const allShort = items.every((t) => t.length > 0 && t.length <= 72)
    if (!allShort) return full
    return `<ul class="rn-article-chips">${inner}</ul>`
  })
}

/** Clusters of <p><strong>Label</strong>: value</p> → comparison / summary cards. */
function enhanceFactCards(html: string): string {
  const factRe =
    /(?:<p>\s*<strong>([^<]+)<\/strong>\s*[:：]\s*([\s\S]*?)<\/p>\s*){2,}/gi
  return html.replace(factRe, (block) => {
    const rows = [...block.matchAll(/<p>\s*<strong>([^<]+)<\/strong>\s*[:：]\s*([\s\S]*?)<\/p>/gi)]
    if (rows.length < 2) return block
    const items = rows
      .map(
        ([, label, value]) =>
          `<div class="rn-article-fact"><span class="rn-article-fact__label">${label.trim()}</span><span class="rn-article-fact__value">${value.trim()}</span></div>`,
      )
      .join('')
    return `<div class="rn-article-facts">${items}</div>`
  })
}

/**
 * Consecutive h3 sections (between h2s) become a visual timeline / card stack
 * when there are 3+ sibling h3s — e.g. month-by-month guides.
 */
function enhanceH3Timelines(html: string): string {
  const parts = html.split(/(?=<h2\b)/i)
  return parts
    .map((part) => {
      const h3Count = (part.match(/<h3\b/gi) || []).length
      if (h3Count < 3) return part
      const chunks = part.split(/(?=<h3\b)/i)
      const head = chunks[0] || ''
      const items = chunks.slice(1)
      if (items.length < 3) return part
      const wrapped = items
        .map((item) => `<div class="rn-article-timeline__item">${item}</div>`)
        .join('')
      return `${head}<div class="rn-article-timeline">${wrapped}</div>`
    })
    .join('')
}

function processArticleContent(
  raw: string,
  figures?: ArticleFigure[],
): { html: string; toc: TocItem[] } {
  let html = markdownToHtml(raw)
  html = stripClasses(html)
  html = transformHtmlProTips(html)
  const decorated = decorateHeadings(html)
  html = injectFigures(decorated.html, figures)
  html = enhanceListGroups(html)
  html = enhanceFactCards(html)
  html = enhanceH3Timelines(html)
  return { html, toc: decorated.toc }
}

function formatDisplayDate(date?: string): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogArticleLayout({
  title,
  excerpt,
  category,
  readTime,
  slug,
  author = 'Royal Nordic Team',
  date,
  heroImage,
  heroImageAlt,
  content,
  relatedExperiences = [],
  figures = [],
}: BlogArticleLayoutProps) {
  const { html, toc } = useMemo(
    () => processArticleContent(content, figures),
    [content, figures],
  )
  const relatedGuides = useMemo(() => relatedBlogEntries(slug, 3), [slug])
  const displayDate = formatDisplayDate(date)
  const [tocOpen, setTocOpen] = useState(false)

  useEffect(() => {
    setTocOpen(false)
  }, [slug])

  const experienceCards = relatedExperiences.map((exp) => {
    const fallback = EXPERIENCE_CARD_IMAGES[exp.href]
    return {
      ...exp,
      image: exp.image || fallback?.image || '/nortti1.jpg',
      imageAlt: exp.imageAlt || fallback?.alt || exp.title,
      cta: exp.cta || 'View experience',
    }
  })

  return (
    <div className="rn-page rn-article">
      <header className="rn-article-hero relative flex items-end overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={heroImageAlt || ''}
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
            onError={(e) => {
              e.currentTarget.src = '/nortti1.jpg'
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-midnight" aria-hidden />
        )}
        <div className="rn-article-hero__veil" aria-hidden />
        <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-28 sm:h-36" aria-hidden />

        <div className="rn-container relative z-10 w-full pb-9 pt-[calc(var(--rn-chrome-h)+1.35rem)] sm:pb-11 sm:pt-[calc(var(--rn-chrome-h)+1.6rem)] lg:pb-12">
          <Link to="/blog" className="rn-article-back rn-reveal">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to guides
          </Link>
          <p className="rn-eyebrow rn-reveal mt-5 text-aurora-soft">{category}</p>
          <h1 className="rn-article-hero__title rn-reveal mt-2.5 max-w-[18ch] font-display font-semibold text-white">
            {title}
          </h1>
          <p className="rn-reveal mt-4 max-w-2xl text-[15px] leading-relaxed text-white/78 sm:mt-4.5 sm:text-[16.5px] sm:leading-[1.6]">
            {excerpt}
          </p>
          <div className="rn-reveal mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {readTime}
            </span>
            <span>{author}</span>
            {displayDate ? <time dateTime={date}>{displayDate}</time> : null}
          </div>
        </div>
      </header>

      <div className="rn-article-shell relative">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-40" aria-hidden />
        <div className="rn-container relative">
          <div className="rn-article-grid">
            <aside className="rn-article-toc-rail" aria-label="On this page">
              {toc.length > 1 ? (
                <nav className="rn-article-toc">
                  <p className="rn-article-toc__label">On this page</p>
                  <ol>
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`}>{item.label}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}
            </aside>

            <article className="rn-article-main min-w-0">
              {toc.length > 1 ? (
                <div className="rn-article-toc-mobile lg:hidden">
                  <button
                    type="button"
                    className="rn-article-toc-mobile__btn"
                    aria-expanded={tocOpen}
                    onClick={() => setTocOpen((v) => !v)}
                  >
                    <List className="h-4 w-4" aria-hidden />
                    {tocOpen ? 'Hide contents' : 'Contents'}
                  </button>
                  {tocOpen ? (
                    <ol className="rn-article-toc-mobile__list">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a href={`#${item.id}`} onClick={() => setTocOpen(false)}>
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ) : null}

              <div
                className="rn-article-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {experienceCards.length > 0 ? (
                <section className="rn-article-experiences" aria-labelledby="rn-article-exp-heading">
                  <p className="rn-eyebrow">Continue planning</p>
                  <h2 id="rn-article-exp-heading" className="rn-h2-tight mt-2 text-white">
                    Related experiences
                  </h2>
                  <ul className="rn-article-experiences__grid mt-6">
                    {experienceCards.map((item) => (
                      <li key={item.href}>
                        <Link to={item.href} className="rn-article-exp-card group">
                          <div className="rn-article-exp-card__media">
                            <img
                              src={item.image}
                              alt={item.imageAlt}
                              className="rn-article-exp-card__img"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="rn-article-exp-card__shade" aria-hidden />
                          </div>
                          <div className="rn-article-exp-card__body">
                            <h3 className="rn-article-exp-card__title">{item.title}</h3>
                            {item.description ? (
                              <p className="rn-article-exp-card__desc">{item.description}</p>
                            ) : null}
                            <span className="rn-article-exp-card__cta">
                              {item.cta}
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {relatedGuides.length > 0 ? (
                <section className="rn-article-more" aria-labelledby="rn-article-more-heading">
                  <div className="rn-article-more__head">
                    <div>
                      <p className="rn-eyebrow">Keep reading</p>
                      <h2 id="rn-article-more-heading" className="rn-h2-tight mt-2 text-white">
                        Related guides
                      </h2>
                    </div>
                    <Link to="/blog" className="rn-article-more__all">
                      All guides
                    </Link>
                  </div>
                  <ul className="rn-article-more__grid">
                    {relatedGuides.map((guide) => (
                      <RelatedGuideCard key={guide.slug} guide={guide} />
                    ))}
                  </ul>
                </section>
              ) : null}
            </article>

            <aside className="rn-article-sidebar" aria-label="Planning sidebar">
              {experienceCards.length > 0 ? (
                <div className="rn-article-side-block">
                  <p className="rn-article-side-block__label">Experiences</p>
                  <ul className="rn-article-side-exp">
                    {experienceCards.slice(0, 3).map((item) => (
                      <li key={`side-${item.href}`}>
                        <Link to={item.href} className="rn-article-side-exp__link">
                          <img src={item.image} alt="" loading="lazy" decoding="async" />
                          <span>
                            <span className="rn-article-side-exp__title">{item.title}</span>
                            <span className="rn-article-side-exp__cta">{item.cta}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {relatedGuides.length > 0 ? (
                <div className="rn-article-side-block">
                  <p className="rn-article-side-block__label">Related guides</p>
                  <ul className="rn-article-side-guides">
                    {relatedGuides.map((guide) => (
                      <li key={`side-g-${guide.slug}`}>
                        <Link to={`/blog/${guide.slug}`} className="rn-article-side-guides__link">
                          {guide.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function RelatedGuideCard({ guide }: { guide: BlogCatalogEntry }) {
  return (
    <li>
      <Link to={`/blog/${guide.slug}`} className="rn-article-guide-card group">
        <div className="rn-article-guide-card__media">
          <img
            src={guide.image}
            alt={guide.imageAlt}
            className="rn-article-guide-card__img"
            loading="lazy"
            decoding="async"
          />
          <div className="rn-article-guide-card__shade" aria-hidden />
        </div>
        <div className="rn-article-guide-card__body">
          <span className="rn-article-guide-card__tag">{guide.category}</span>
          <h3 className="rn-article-guide-card__title">{guide.title}</h3>
          <p className="rn-article-guide-card__meta">{guide.readTime} read</p>
        </div>
      </Link>
    </li>
  )
}

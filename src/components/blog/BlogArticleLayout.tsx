import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react'
import CategoryHero from '../CategoryHero'
import Footer from '../Footer'

export type RelatedExperience = {
  title: string
  href: string
  description?: string
}

export type BlogArticleLayoutProps = {
  title: string
  excerpt: string
  category: string
  readTime: string
  author?: string
  date?: string
  heroImage?: string
  content: string
  relatedExperiences?: RelatedExperience[]
}

const looksLikeHtml = (content: string): boolean =>
  /<\/?(?:p|div|h[1-6]|ul|ol|li|a|strong)\b/i.test(content)

const markdownToHtml = (markdown: string): string => {
  if (looksLikeHtml(markdown)) {
    return markdown.trim()
  }

  return markdown
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
      if (/^<(h[2-3]|ul|ol|div)\b/i.test(trimmed)) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')
}

const BlogArticleLayout: React.FC<BlogArticleLayoutProps> = ({
  title,
  excerpt,
  category,
  readTime,
  author = 'Royal Nordic Team',
  date,
  heroImage,
  content,
  relatedExperiences,
}) => {
  const html = markdownToHtml(content)
  const backLink = (
    <Link to="/blog" className="rn-article-back">
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      Back to guides
    </Link>
  )

  return (
    <div className="rn-page flex min-h-screen flex-col">
      {heroImage ? (
        <CategoryHero
          title={title}
          subtitle={excerpt}
          image={heroImage}
          compact
          lead={backLink}
        />
      ) : (
        <header className="rn-container rn-page-pad rn-article-mast max-w-[42rem] pb-4 pt-8 sm:pt-10">
          <Link to="/blog" className="rn-article-back rn-article-back--plain">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to guides
          </Link>
          <span className="rn-badge-aurora mt-6 inline-flex">{category}</span>
          <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.35rem)] font-semibold leading-[1.12] text-white">
            {title}
          </h1>
          <p className="rn-article-dek mt-4">{excerpt}</p>
        </header>
      )}

      <article className="rn-section-tight relative flex-1 bg-midnight">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-60" aria-hidden />
        <div className="rn-container relative mx-auto w-full max-w-[42rem]">
          <div className="rn-article-meta flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="rn-badge-aurora">{category}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-text-dim">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {readTime}
            </span>
            <span className="text-sm text-text-dim">{author}</span>
            {date ? (
              <time className="text-sm text-text-dim" dateTime={date}>
                {date}
              </time>
            ) : null}
          </div>

          <div
            className="rn-article-body pt-8 sm:pt-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {relatedExperiences && relatedExperiences.length > 0 ? (
            <aside className="rn-article-related mt-14 sm:mt-16">
              <div className="rn-article-related__head">
                <p className="rn-eyebrow">Continue planning</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
                  Related experiences
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                  Tours that pair well with what you are reading — all depart from Rovaniemi.
                </p>
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
                {relatedExperiences.map((item) => (
                  <li key={item.href}>
                    <Link to={item.href} className="rn-article-related__card group">
                      <span className="font-display text-base font-semibold leading-snug text-white transition group-hover:text-aurora-soft sm:text-lg">
                        {item.title}
                      </span>
                      {item.description ? (
                        <span className="mt-1.5 block text-sm leading-relaxed text-text-muted">
                          {item.description}
                        </span>
                      ) : null}
                      <ArrowUpRight
                        className="rn-article-related__icon mt-3 h-4 w-4 text-aurora-soft/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-aurora-soft"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </article>

      <Footer />
    </div>
  )
}

export default BlogArticleLayout

import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
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

const ARTICLE_BODY =
  'rn-article-body font-body text-[1.0625rem] leading-[1.75] text-text-muted [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-5 [&_strong]:font-semibold [&_strong]:text-white [&_a]:text-aurora-soft [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-aurora [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_li]:text-text-muted [&_img]:my-8 [&_img]:w-full [&_img]:rounded-rn'

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

  return (
    <div className="rn-page flex min-h-screen flex-col">
      {heroImage ? (
        <div className="relative">
          <CategoryHero title={title} subtitle={excerpt} image={heroImage} compact />
          <div className="rn-container absolute left-0 right-0 top-0 z-20 pt-[calc(var(--rn-header-h)+var(--rn-promo-bar-height,0px)+1rem)] sm:pt-[calc(var(--rn-header-h)+var(--rn-promo-bar-height,0px)+1.25rem)]">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-rn border border-white/15 bg-black/40 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-aurora/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to blog
            </Link>
          </div>
        </div>
      ) : (
        <header className="rn-container rn-page-pad max-w-[65ch] pb-6 pt-8 sm:pt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition hover:text-aurora-soft"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to blog
          </Link>
          <span className="rn-badge-aurora mt-6 inline-flex">{category}</span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-muted sm:text-lg">{excerpt}</p>
        </header>
      )}

      <article className="rn-section-tight flex-1 bg-midnight">
        <div className="rn-container mx-auto w-full max-w-[65ch]">
          <div
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 pb-8 text-sm text-text-dim ${heroImage ? '' : 'pt-2'}`}
          >
            {heroImage ? <span className="rn-badge-aurora">{category}</span> : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {readTime}
            </span>
            <span>{author}</span>
            {date ? <time className="text-text-dim">{date}</time> : null}
          </div>

          <div
            className={`${ARTICLE_BODY} pt-8`}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {relatedExperiences && relatedExperiences.length > 0 ? (
            <aside className="mt-14 border-t border-white/10 pt-10">
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
                Related experiences
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Book a Royal Nordic tour that matches what you are planning in Lapland.
              </p>
              <ul className="mt-6 space-y-3">
                {relatedExperiences.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="group block rounded-rn border border-white/10 bg-surface p-4 transition hover:border-aurora/35 hover:bg-surface-2 sm:p-5"
                    >
                      <span className="font-display text-lg font-semibold text-white group-hover:text-aurora-soft">
                        {item.title}
                      </span>
                      {item.description ? (
                        <span className="mt-1 block text-sm leading-relaxed text-text-muted">
                          {item.description}
                        </span>
                      ) : null}
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

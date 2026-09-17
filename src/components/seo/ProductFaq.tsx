import React from 'react'
import JsonLd from './JsonLd'

export type FaqItem = {
  question: string
  answer: string
}

type ProductFaqProps = {
  items: FaqItem[]
  /** Unique id for the FAQ JSON-LD script */
  schemaId: string
  /** snow = light surfaces (flagship); dark = legacy tour pages */
  tone?: 'dark' | 'snow'
}

/**
 * Visible FAQ section + FAQPage JSON-LD. Answers must match on-page facts only.
 */
const ProductFaq: React.FC<ProductFaqProps> = ({ items, schemaId, tone = 'dark' }) => {
  if (!items.length) return null

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const snow = tone === 'snow'

  return (
    <>
      <JsonLd id={schemaId} data={faqSchema} />
      <div
        className={
          snow
            ? 'rounded-rn-lg border border-black/5 bg-frost p-4 sm:p-6'
            : 'rounded-lg border border-white/10 bg-white/5 p-3 sm:rounded-xl sm:p-4 lg:p-6 backdrop-blur-sm'
        }
      >
        <h2
          className={
            snow
              ? 'mb-4 font-display text-2xl font-semibold text-ink'
              : 'mb-3 font-luxury text-lg font-bold text-white sm:mb-4 sm:text-xl lg:text-2xl'
          }
        >
          Frequently Asked Questions
        </h2>
        <dl className="space-y-4">
          {items.map((item) => (
            <div key={item.question}>
              <dt
                className={
                  snow
                    ? 'mb-1 text-sm font-semibold text-ink sm:text-base'
                    : 'mb-1 text-sm font-semibold text-white sm:text-base'
                }
              >
                {item.question}
              </dt>
              <dd
                className={
                  snow
                    ? 'text-sm leading-relaxed text-ink-muted sm:text-base'
                    : 'font-clean text-sm leading-relaxed text-gray-300 sm:text-base'
                }
              >
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

export default ProductFaq

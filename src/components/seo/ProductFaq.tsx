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
}

/**
 * Visible FAQ section + FAQPage JSON-LD. Answers must match on-page facts only.
 */
const ProductFaq: React.FC<ProductFaqProps> = ({ items, schemaId }) => {
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

  return (
    <>
      <JsonLd id={schemaId} data={faqSchema} />
      <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-4">
          {items.map((item) => (
            <div key={item.question}>
              <dt className="text-white font-semibold text-sm sm:text-base mb-1">{item.question}</dt>
              <dd className="text-gray-300 text-sm sm:text-base font-clean leading-relaxed">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

export default ProductFaq

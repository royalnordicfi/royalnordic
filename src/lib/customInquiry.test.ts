import { describe, expect, it } from 'vitest'
import { buildCustomInquiryMessage } from './customInquiry'

describe('buildCustomInquiryMessage', () => {
  it('composes dates, guests and interests for the existing backend message field', () => {
    expect(
      buildCustomInquiryMessage({
        dates: '12–18 Mar 2027',
        guests: '4 adults',
        interests: 'Private aurora evening and ice fishing.',
      }),
    ).toBe(
      ['Preferred dates: 12–18 Mar 2027', 'Number of guests: 4 adults', '', 'Private aurora evening and ice fishing.'].join(
        '\n',
      ),
    )
  })

  it('omits empty optional lines', () => {
    expect(
      buildCustomInquiryMessage({
        dates: '',
        guests: '',
        interests: 'Photography-focused private tour.',
      }),
    ).toBe('Photography-focused private tour.')
  })
})

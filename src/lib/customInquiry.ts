/** Compose the free-text message sent to send-customized-tour-request. */
export function buildCustomInquiryMessage(input: {
  dates: string
  guests: string
  interests: string
}): string {
  const dates = String(input.dates || '').trim()
  const guests = String(input.guests || '').trim()
  const interests = String(input.interests || '').trim()
  const lines: string[] = []
  if (dates) lines.push(`Preferred dates: ${dates}`)
  if (guests) lines.push(`Number of guests: ${guests}`)
  if (interests) {
    if (lines.length) lines.push('')
    lines.push(interests)
  }
  return lines.join('\n').trim()
}

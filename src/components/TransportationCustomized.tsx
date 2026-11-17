import { Mail } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import { LEVI_VEHICLE_PRICE } from '../lib/transferPricing'

const GALLERY = [
  { src: '/royal-trans-3.jpg', alt: 'Private customized transportation in Lapland' },
  { src: '/royal-trans-4.jpg', alt: 'Flexible private transfer across Finnish Lapland' },
  { src: '/royal-trans-1.jpg', alt: 'Royal Nordic transfer vehicle' },
]

const HIGHLIGHTS = [
  'Custom routes across Lapland — airport, hotels, multi-stop days',
  'Flexible group sizes — we arrange suitable vehicles or multiple vehicles',
  'Personalized quote by email — submitting this form is not a confirmed booking',
]

type TripType = 'one_way' | 'round_trip'

type FormState = {
  name: string
  email: string
  phone: string
  pickupLocation: string
  destination: string
  preferredDate: string
  preferredTime: string
  tripType: TripType
  returnDate: string
  returnTime: string
  adults: string
  children: string
  infants: string
  largeSuitcases: string
  smallBags: string
  specialLuggage: string
  specialRequirements: string
  additionalInfo: string
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  pickupLocation: '',
  destination: '',
  preferredDate: '',
  preferredTime: '',
  tripType: 'one_way',
  returnDate: '',
  returnTime: '',
  adults: '2',
  children: '0',
  infants: '0',
  largeSuitcases: '0',
  smallBags: '0',
  specialLuggage: '',
  specialRequirements: '',
  additionalInfo: '',
}

function toCount(value: string) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const TransportationCustomized = () => {
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const submittingLock = useRef(false)
  const inputClass = 'rn-form-input'

  const totalPassengers = useMemo(
    () =>
      toCount(formData.adults) + toCount(formData.children) + toCount(formData.infants),
    [formData.adults, formData.children, formData.infants],
  )

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    if (submitStatus === 'success') setSubmitStatus('idle')
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!formData.name.trim()) next.name = 'Please enter your full name'
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      next.email = 'Please enter a valid email'
    }
    if (!formData.pickupLocation.trim()) next.pickupLocation = 'Pickup location is required'
    if (!formData.destination.trim()) next.destination = 'Destination is required'
    if (!formData.preferredDate) next.preferredDate = 'Please choose a date'
    if (totalPassengers < 1) next.adults = 'At least one passenger is required'
    if (formData.tripType === 'round_trip') {
      if (!formData.returnDate) next.returnDate = 'Return date is required for round trips'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingLock.current || isSubmitting) return
    if (!validate()) return

    submittingLock.current = true
    setIsSubmitting(true)
    setSubmitStatus('idle')

    const adults = toCount(formData.adults)
    const children = toCount(formData.children)
    const infants = toCount(formData.infants)
    const total = adults + children + infants
    const groupSummary = `${adults} adults, ${children} children, ${infants} infants (${total} total)`

    const detailBlocks = [
      `Trip type: ${formData.tripType === 'round_trip' ? 'Round trip' : 'One way'}`,
      formData.tripType === 'round_trip'
        ? `Return: ${formData.returnDate || '—'} ${formData.returnTime || ''}`.trim()
        : null,
      `Passengers: ${groupSummary}`,
      `Luggage: ${toCount(formData.largeSuitcases)} large suitcases, ${toCount(formData.smallBags)} small / carry-on`,
      formData.specialLuggage.trim()
        ? `Additional luggage / equipment: ${formData.specialLuggage.trim()}`
        : null,
      formData.specialRequirements.trim()
        ? `Special transportation requirements: ${formData.specialRequirements.trim()}`
        : null,
      formData.additionalInfo.trim() ? `Other notes: ${formData.additionalInfo.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-transportation-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            destination: formData.destination.trim(),
            pickupDetails: formData.pickupLocation.trim(),
            preferredDate: formData.preferredDate || null,
            preferredTime: formData.preferredTime || '',
            groupSize: groupSummary,
            tripType: formData.tripType,
            returnDate: formData.returnDate || null,
            returnTime: formData.returnTime || '',
            adults,
            children,
            infants,
            totalPassengers: total,
            largeSuitcases: toCount(formData.largeSuitcases),
            smallBags: toCount(formData.smallBags),
            specialLuggage: formData.specialLuggage.trim(),
            specialRequirements: formData.specialRequirements.trim(),
            additionalInfo: detailBlocks,
            serviceType: 'Private Customized Transportation',
            to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
            subject: 'Custom Transportation Quote Request - ROYAL NORDIC',
          }),
        },
      )

      if (response.ok) {
        setSubmitStatus('success')
        setFormData(EMPTY_FORM)
        setFieldErrors({})
      } else {
        console.error('Response not ok:', response.status, await response.text())
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Request failed:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
      submittingLock.current = false
    }
  }

  const included = [
    'Custom routes throughout Lapland',
    'Flexible scheduling for any group size',
    'Professional driver with local knowledge',
    'Suitable vehicle or multiple vehicles as needed',
    'Airport, hotel and multi-stop itineraries',
    'Luggage assistance included',
    'Child seats upon request',
  ]

  const fieldError = (key: keyof FormState) =>
    fieldErrors[key] ? (
      <p className="mt-1 text-[12px] text-red-600" role="alert">
        {fieldErrors[key]}
      </p>
    ) : null

  return (
    <div className="rn-page pb-10">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Transportation', to: '/transportation' },
          { label: 'Custom transfers' },
        ]}
        eyebrow="Lapland · Private transfers"
        title="Transportation Tailored to Your Journey"
        lede="From private airport transfers to transportation for larger groups, tell us where you're going and what you need. We'll arrange a suitable solution and provide a personalized quote."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: 'Flexible' },
          { label: 'Groups', value: 'Any size' },
          { label: 'Coverage', value: 'Finnish Lapland' },
          { label: 'Booking', value: 'Quote on request' },
        ]}
      >
        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Overview</h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Private transfers built around your route — airport runs, hotel hops, sightseeing with
            multiple stops, or remote lodges. For larger parties we plan suitable capacity with one or
            more vehicles. No eight-person limit on customized requests.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            For the fixed Rovaniemi–Levi/Kittilä indicative rate (from €{LEVI_VEHICLE_PRICE} / vehicle),
            see our{' '}
            <Link to="/transportation-rovaniemi-levi" className="font-medium text-aurora-soft hover:underline">
              Levi/Kittilä transfer page
            </Link>
            .
          </p>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Highlights</h2>
          <div className="mt-5">
            <ExperienceHighlights items={HIGHLIGHTS} />
          </div>
        </section>

        <section
          id="custom-quote-form"
          className="rn-reveal scroll-mt-28 rounded-[var(--rn-radius-md)] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7"
        >
          <p className="rn-eyebrow">Quote request</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
            Request a Custom Quote
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Required fields are marked. Submitting this form requests a quote — it does not confirm a
            booking or charge a payment.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-8" noValidate>
            <fieldset className="space-y-3">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-soft">
                Contact information
              </legend>
              <div>
                <label htmlFor="name" className="sr-only">
                  Full name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Full name *"
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldError('name')}
              </div>
              <div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="Email address *"
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldError('email')}
              </div>
              <div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={inputClass}
                  placeholder="Phone (optional, with country code)"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-soft">
                Journey information
              </legend>
              <div>
                <input
                  type="text"
                  id="pickupLocation"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Pickup location *"
                  aria-invalid={!!fieldErrors.pickupLocation}
                />
                {fieldError('pickupLocation')}
              </div>
              <div>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Destination *"
                  aria-invalid={!!fieldErrors.destination}
                />
                {fieldError('destination')}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="preferredDate" className="mb-1 block text-[12px] text-text-dim">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    aria-invalid={!!fieldErrors.preferredDate}
                  />
                  {fieldError('preferredDate')}
                </div>
                <div>
                  <label htmlFor="preferredTime" className="mb-1 block text-[12px] text-text-dim">
                    Preferred pickup time
                  </label>
                  <input
                    type="time"
                    id="preferredTime"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tripType" className="mb-1 block text-[12px] text-text-dim">
                  Trip type
                </label>
                <select
                  id="tripType"
                  name="tripType"
                  value={formData.tripType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="one_way">One way</option>
                  <option value="round_trip">Round trip</option>
                </select>
              </div>
              {formData.tripType === 'round_trip' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="returnDate" className="mb-1 block text-[12px] text-text-dim">
                      Return date *
                    </label>
                    <input
                      type="date"
                      id="returnDate"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleChange}
                      className={inputClass}
                      aria-invalid={!!fieldErrors.returnDate}
                    />
                    {fieldError('returnDate')}
                  </div>
                  <div>
                    <label htmlFor="returnTime" className="mb-1 block text-[12px] text-text-dim">
                      Return time
                    </label>
                    <input
                      type="time"
                      id="returnTime"
                      name="returnTime"
                      value={formData.returnTime}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : null}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-soft">
                Group & luggage
              </legend>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="adults" className="mb-1 block text-[12px] text-text-dim">
                    Adults
                  </label>
                  <input
                    type="number"
                    id="adults"
                    name="adults"
                    min={0}
                    max={500}
                    step={1}
                    value={formData.adults}
                    onChange={handleChange}
                    className={inputClass}
                    aria-invalid={!!fieldErrors.adults}
                  />
                </div>
                <div>
                  <label htmlFor="children" className="mb-1 block text-[12px] text-text-dim">
                    Children
                  </label>
                  <input
                    type="number"
                    id="children"
                    name="children"
                    min={0}
                    max={500}
                    step={1}
                    value={formData.children}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="infants" className="mb-1 block text-[12px] text-text-dim">
                    Infants
                  </label>
                  <input
                    type="number"
                    id="infants"
                    name="infants"
                    min={0}
                    max={500}
                    step={1}
                    value={formData.infants}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              {fieldError('adults')}
              <p className="text-[13px] text-text-muted">
                Total passengers:{' '}
                <span className="font-semibold text-white">{totalPassengers}</span>
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="largeSuitcases" className="mb-1 block text-[12px] text-text-dim">
                    Large suitcases
                  </label>
                  <input
                    type="number"
                    id="largeSuitcases"
                    name="largeSuitcases"
                    min={0}
                    max={500}
                    step={1}
                    value={formData.largeSuitcases}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="smallBags" className="mb-1 block text-[12px] text-text-dim">
                    Small bags / carry-on
                  </label>
                  <input
                    type="number"
                    id="smallBags"
                    name="smallBags"
                    min={0}
                    max={500}
                    step={1}
                    value={formData.smallBags}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              <textarea
                id="specialLuggage"
                name="specialLuggage"
                value={formData.specialLuggage}
                onChange={handleChange}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Skis, snowboards, strollers, wheelchairs, or other equipment"
              />
              <textarea
                id="specialRequirements"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Special transportation requirements (optional)"
              />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-soft">
                Additional information
              </legend>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Flight numbers, multi-stop plans, or anything else we should know"
              />
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rn-btn-primary flex w-full items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending quote request…
                </>
              ) : (
                <>
                  Request a Custom Quote
                  <Mail className="h-5 w-5" aria-hidden />
                </>
              )}
            </button>

            {submitStatus === 'success' && (
              <p className="text-center text-sm text-aurora-soft" role="status">
                Quote request sent. We&apos;ll email you a personalized proposal — this is not a
                confirmed booking.
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="text-center text-sm text-red-400" role="alert">
                Could not send your request. Please try again or email contact@royalnordic.fi.
              </p>
            )}
          </form>
        </section>

        <section className="rn-reveal">
          <ExperienceInclusions included={included} />
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'Quotes',
                  content:
                    'Pricing depends on route, timing, passenger count and luggage. Send your details — we reply with a quote, typically within 24 hours. No vehicles are assigned until we confirm.',
                },
                {
                  title: 'Group size',
                  content:
                    'There is no eight-person limit on customized transportation. Tell us your passenger and luggage numbers; we arrange suitable capacity, including multiple vehicles when needed.',
                },
                {
                  title: 'Fixed Levi route',
                  content: (
                    <>
                      For Rovaniemi–Levi/Kittilä transfers with an indicative per-vehicle rate (from €
                      {LEVI_VEHICLE_PRICE}), see our{' '}
                      <Link
                        to="/transportation-rovaniemi-levi"
                        className="font-medium text-aurora-soft hover:underline"
                      >
                        Levi/Kittilä transfer page
                      </Link>
                      .
                    </>
                  ),
                },
              ]}
            />
          </div>
        </section>
      </ExperienceProductLayout>

      <Footer />
    </div>
  )
}

export default TransportationCustomized
